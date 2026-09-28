# MCP Support — Design Record

Status: built and tested; not deployed. How to use it: `../patterns/mcp.md`.

## Shape

```
AI client -> MCP gateway (Forge: teams, visibility, curated virtual servers)
          -> gateway identity plugin: per-call RS256 assertion in the _forge_identity argument
          -> /api/mcp (gateway credential + assertion) -> {Feature}Controller method
```

The gateway decides who may call which tool. This API verifies who is calling and runs the operation as that user under the same data rules as HTTP.

## Pieces

| Piece | Where |
|-------|-------|
| XML contract | `<mcp>` on `<query>`/`<mutation>`, field `friendlyName`/`description` (`server/generation/xml/stencil-entities.xml`) |
| Generator | `server/generation/xsl/nest.mcp.xsl`, with contract validation written as `code-gen-error` lines |
| Runtime | `backend/src/shared/mcp/`: MCP SDK v2 handler (both protocol eras), identity verifier, replay store, dispatcher, audit line |
| Caller shape | `backend/src/shared/types/feature-request.ts`, `backend/src/shared/access-control/account-resolver.service.ts` |
| Example | `features/user/profile/`: `ProfileController implements IProfileOperations`; two test tools |
| Tests | `backend/test/features/mcp.e2e-spec.ts` (isolated, with tool-contract snapshot), `mcp-stack.e2e-spec.ts` (full stack) |
| Gateway side | Forge repository: `plugins/identity_jwt/`, contract in `docs/UPSTREAM-IDENTITY.md` |

## Decisions

- **The gateway owns rights; this API owns data boundaries.** No MCP permission list here. Every call resolves a live, local account, and the tenant comes only from that account.
- **Identity travels in a tool argument, not a header.** ContextForge reuses one upstream session per downstream session and pins HTTP headers at creation, so a per-call header goes stale. The gateway's stored bearer credential rides in `Authorization` and authenticates the gateway only.
- **Identity assertion:** RS256, JOSE `typ` `forge-upstream+jwt`, issuer `MCP_IDENTITY_ISSUER`, audience = the registered URL, bound to one tool, 60 s lifetime, single-use `jti`.
- **Opt-in per operation in XML.** No `<mcp>`, no tool. Gateway curation is a second, independent gate.
- **No service layer.** The hand-written controller implements the generated `I{Feature}Operations`; MCP calls the same method HTTP routes to. The contract uses property form, so implementations typed with `StencilRequest` fail the build; `FeatureRequest` carries only auth payload and account.
- **Singleton controllers only;** no request-scoped providers in the framework.
- **Idempotency is endpoint design,** not plumbing: repeated calls must be harmless over either channel, backed by unique records where needed.
- **Both protocol eras** from one endpoint: 2025-11-25 statelessly, 2026-07-28 natively.
- **Results are projections, class-only types, or feature entities;** full documents are refused by the generator.
- **`/api/mcp` skips `DateTransformInterceptor`** (MCP's `protocolVersion` looks like a date); the dispatcher applies the same conversion to tool arguments so controllers see identical input.

## Test infrastructure notes

e2e runs needed test-only fixes, now in place: `uuid@13` (ESM-only) and `firebase-admin` (ESM-only dependency) are mapped to shims in `test/jest-e2e.json`; the MongoDB 7.6 driver's dynamic `import('os')` fails under Jest, so the test Mongo provider passes `runtimeAdapters`; `createTestApp` forces local auth regardless of a developer `.env`.

## Deferred

- Deployment: set `MCP_RESOURCE_URL`, `MCP_GATEWAY_TOKEN`, `MCP_IDENTITY_ISSUER`; register the endpoint as a private gateway (`STREAMABLEHTTP`, `cache` mode, bearer = the gateway token, tag `forge:identity-jwt`); curate tools; one live call end to end.
- Explicit request/response size caps beyond the default 100 KB body limit, per-tool timeouts.
- Admin-area features (`area="user"` only today).
- Resources over projections, the Tasks extension, `subscriptions/listen`.
