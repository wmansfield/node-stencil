# MCP Tools

Feature operations can be exposed as MCP tools at `/api/mcp`. The endpoint is served to an MCP gateway (the supported one is Forge, a customized IBM ContextForge), which owns access control: which user may call which tool (teams, visibility, curated virtual servers). This API owns data boundaries: it verifies who is calling and runs the operation as that user, exactly as an HTTP call would.

## Exposing an operation

Add an `<mcp>` child to the feature `<query>` or `<mutation>` in `server/generation/xml/stencil-entities.xml`, give the request fields a `friendlyName` and `description`, and run the generator. Attribute reference and validation rules: `code-generation.md` ("MCP tools").

```xml
<entity name="NameRequest">
  <field type="string" friendlyName="Display Name" description="Name shown to other people.">display_name</field>
</entity>
<mutation name="nameUpdate" route="v1/profile/name" request="params" requestType="NameRequest" itemResult="Account.Self">
  <mcp tool="profile_update_display_name" title="Update display name" destructive="false" idempotent="true">
    <description>Set the signed-in user's display name. Returns the updated profile.</description>
  </mcp>
</mutation>
```

The generator writes, every run:

| File | Contents |
|------|----------|
| `features/{area}/{feature}/{feature}.operations.ts` | `I{Feature}Operations`: one member per MCP-enabled operation |
| `features/{area}/{feature}/{feature}.mcp.base.ts` | Tool definitions: name, title, description, annotations, input/output JSON Schema |
| `features/mcp.schemas.ts` | JSON Schema builders for class-only types and projections |
| `features/mcp.registry.ts` | Every MCP-enabled feature bound to its controller |

## Implementing it: the controller is the implementation

There is no service layer. The hand-written `{Feature}Controller` declares `implements I{Feature}Operations`, and MCP calls the same method HTTP routes to.

```typescript
@Controller('v1/profile')
export class ProfileController implements IProfileOperations {
   @RateLimit({ points: 30, duration: 60 })
   @UseGuards(AuthGuard, RateLimitGuard)
   @Post('name')
   @HttpCode(200)
   async nameUpdate(@Req() request: FeatureRequest, @Body(Sanitize.for(NameRequest)) input: INameRequest): Promise<ItemResult<Account.Self>> {
      if (!request.account) {
         throw new ForbiddenException();
      }
      // request.account.jurisdiction_id for data access, as in every user feature
   }
}
```

- **Method name** equals the XML operation name.
- **Request type** is `FeatureRequest` (`auth.payload` and `account` only). HTTP passes its `StencilRequest`, which already has that shape after `AuthGuard`; MCP builds it from the verified identity and the live account. The contract is emitted in property form, so a method typed with `StencilRequest` fails the build (TS2416).
- **Needs the raw request?** Keep the HTTP handler for the request-specific part and move the shared logic into a private method both paths call. An operation that cannot be separated that way is not an MCP tool.
- **Singleton controllers only.** The dispatcher resolves the controller instance once at startup. Request-scoped providers are not used in this framework; caller context travels as arguments.

Guard decorators apply to HTTP. For MCP the dispatcher enforces the equivalent before calling the method: verified identity, live enabled account, account homed on this instance, per-user per-tool rate limit (30/min), and the request model's `Sanitize` validators (with the same date conversion HTTP applies).

## Results and errors

| Operation outcome | MCP response |
|-------------------|--------------|
| `ItemResult` success | `structuredContent` = the item (plus the same JSON as text) |
| `ListResult` success | `structuredContent` = `{ items, paging, stepping }` |
| `ActionResult` success | text `{"success":true}` |
| `success: false`, 4xx `HttpException`, `UIException`, invalid arguments | tool result with `isError: true` and a safe message; the model can correct and retry |
| Missing/invalid identity, unknown account, wrong region | JSON-RPC error `-32001` |
| Unknown tool | JSON-RPC error `-32602` |
| Unexpected failure | tool error with a reference id; full error logged server-side |

Results must be a projection, a class-only type, or a feature entity; the generator refuses full documents. Output schemas allow `null` for nullable fields because MCP clients validate `structuredContent` against them.

## Retries and idempotency

MCP clients may re-send a request after a broken connection. There is no plumbing-level de-duplication: each endpoint must make a repeated call harmless, whether it arrived over HTTP or MCP. Prefer setting values over incrementing them, and back creates with a record that can be made unique (`<uniquekey>` on a domain key). `idempotent="false"` on `<mcp>` declares that repeating the call is not safe; it does not make the runtime de-duplicate.

## Identity: how a call is authenticated

1. Every HTTP request to `/api/mcp` carries the gateway credential (`Authorization: Bearer <MCP_GATEWAY_TOKEN>`). It authenticates Forge only and is sufficient for `initialize`/`tools/list`, never for `tools/call`.
2. Each `tools/call` carries `_forge_identity` in its arguments: an RS256 assertion minted per call by Forge's `identity_jwt` plugin (arguments, not a header, because Forge pins headers on pooled upstream sessions). The dispatcher removes it before validation and requires: signature from Forge's JWKS, `typ: forge-upstream+jwt`, issuer, `aud` equal to `MCP_RESOURCE_URL`, lifetime at most 5 minutes (30s skew), `mcp_tool` equal to the called tool, and a `jti` never seen before (Redis when `REDIS_URL` is set).
3. `sub` (the staff email) resolves to the live account through `AccountResolver`, the same lookup HTTP auth commands use.

Contract on the Forge side: `docs/UPSTREAM-IDENTITY.md` in the Forge repository.

## Configuration

| Variable | Meaning |
|----------|---------|
| `MCP_RESOURCE_URL` | The exact URL registered on the gateway; also the assertion audience. Endpoint off when unset |
| `MCP_GATEWAY_TOKEN` | Bearer credential stored on that gateway (32+ characters). Endpoint off when unset |
| `MCP_ALLOWED_ORIGINS` | Browser origins allowed to call the endpoint; normally blank (the gateway sends no Origin) |
| `MCP_IDENTITY_ISSUER` | Gateway issuer whose `{issuer}/jwks` signs assertions. Required when the endpoint is enabled |
| `FEDERATION_JURISDICTION` | Jurisdictions this instance hosts; callers homed elsewhere are refused |

## Tests

- `test/features/mcp.e2e-spec.ts`: endpoint in isolation (transport, credential, every identity rejection, error mapping, HTTP parity) plus a `tools/list` snapshot. A snapshot change is a published contract change; review it as one.
- `test/features/mcp-stack.e2e-spec.ts`: the full test app with Mongo; a tool call updates the asserted user and nobody else.
- `test/setup/mcp-test-identity.ts`: `TestForge` signs assertions exactly as the Forge plugin does.
