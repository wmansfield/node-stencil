# What Stencil Gives You

Stencil is a platform with a generator, not a CRUD scaffold. The XML schema is the contract; generated bases stay aligned; custom logic stays in small extension files. The items below are capabilities you inherit when you use that contract — not a product catalogue.

This training clone includes most of the runtime. A few production pieces (HMAC federation client, Cloudflare/OIDC IaC) are the **designed topology** documented in [`developers/README.md`](../developers/README.md) but are not runnable code here. Those are called out as such.

See also: [`code-generation.md`](./code-generation.md) for XML attributes.

## Schema-gated change (narrow blast radius)

You change the XML, regenerate, and keep business rules in `*.manager.ts` and `*.controller.ts`. Boilerplate is not rewritten by hand or by an agent on every task.

This is **regenerating** codegen, not a write-once template. Scaffolders that emit files you then own are a different tool. Models, schemas, and `*.base.ts` are overwritten on every run; treating them as “generated then customized” loses the next generate.

What that buys:

- **One source of truth** for entities, indexes, projections, tenant isolation, permissions, and admin CRUD.
- **Regeneratable bases.** Drift dies on the next generator run.
- **Small custom surface.** Review is a schema diff plus a few extension files.
- **Predictable types.** Backend models, Mongoose schemas, RTK Query hooks, and admin forms share the same XML.

Contrast with free-form AI authorship: the model can invent a parallel API, skip a tenant filter, or forget a projection. Stencil makes those mistakes schema violations instead of silent code bugs.

## Domain-driven shape

The XML is a bounded-context sketch, not a table dump:

| Concept | What it is |
|---------|------------|
| `<item>` | An aggregate / entity with a clear name and tenant boundary |
| **Sole-mutator manager** | The only write path for that aggregate — document lifecycle lives here, not in controllers or raw Mongo |
| `perspective` | Concurrent-safe partial write — named field group with its own sanitize/validate/pre/post hooks |
| `<projection>` | Typed read model that is also the Mongo `.select()` — leak control and query cost |
| `<feature>` | A use-case API with typed request/result contracts |
| `calculated` / `recalculate` | Derived state owned by the aggregate, folded by the manager |
| Foreign keys + coordinator | Generated existence checks and invalidation / eager recompute |

You expand a domain by adding fields, perspectives, and projections — then filling `applyCalculations` and feature controllers. Feature code calls managers; it does not open a second persistence model.

## Sole-mutator managers (document lifecycle)

Every collection entity has a manager. **That manager is the only place documents are inserted, replaced, perspective-updated, or deleted.** Controllers, tasks, and other managers go through it. They do not call Mongoose models, `$set` ad-hoc, or `collection.updateOne` for domain data.

Generated `insert` / `replace` / `delete` / `update{Name}Perspective` all run the same **document lifecycle** (`DocumentOperation`):

1. **preProcessMutation** (document and each perspective)
2. **searchable blob** if the entity has `searchable` fields
3. **sanitize** then **validate** (plus `extraValidation` hooks, FK `validateExistence`)
4. **persist** (`_insert` / `_upsert` / `_updatePartial` / `_delete`)
5. **calculateAndPersist** when calculated fields exist
6. **postProcessMutation**
7. **dependency fan-out** (`DependencyCoordinator.on{Child}Changed`, `foreignKeyComputesMe` cascades)

Override the hooks on `*.manager.ts` (`sanitize`, `validate`, `applyCalculations`, `preProcessMutation*`, `postProcessMutation*`). Do not fork a parallel write. `replace` is exception-only in custom code — see perspective safety below.

Physical account erasure is still a manager write: generated `deleteAllForAccount` (or an override on `*.manager.ts`) is the only bulk hard-delete. Controllers do not `deleteMany`.

## Account erasure (DSAR)

Tombstones (`deleted_utc`) stay the normal delete so sync and federation still see the row. Physical `deleteMany` is **only** the account-erasure path. The schema owns that path: every collection `<item>` declares `accountDeletion`, the generator emits `entities/account-deletion-manager.ts`, and `AccountDeletionService.eraseAccount` walks the registry. A handwritten “list of collections to wipe” is a second source of truth and will drift.

What you inherit:

- **A stance on every collection.** `owned` / `none` / `retained` / `custom` / `released` / `paired` / `hosted` / `referenced` / `embedded`. Silence is the bug — a new entity that omits `accountDeletion` will not be erased.
- **Generated bulk delete for the simple case.** `owned` plus `accountOwner="true"` emits `deleteAllForAccount` on the manager base (`IAccountDeletionManager`). Queryable Encryption collections cannot `deleteMany`; the mongo helper uses per-id `deleteOne` when encrypted fields are registered.
- **Ordered plan, not entity-name special cases.** `accountDeletionPhase` is a string label (this clone uses `storage` then `account`). `accountDeletionOrder` is global; lower runs first. The walker does not splice `'Account'` or `'Asset'` by name.
- **Extra erasure work stays on `*.manager.ts`.** `custom` + `deletionHandler` (auth mapping by `auth_identifier`), `released` + `releaseHandler` (unlink an identifier), `paired` remote hooks, `hosted`/`referenced` filters that are not a single owner field. Override `deleteAllForAccount` when extra work is required (object-storage keys before rows).
- **Identity after data.** After the registry, `eraseAccount` calls `IAuthProvider.revokeUser`. Firebase vs local HS256 is still the pluggable provider.

What you still write in product code: confirmation, export, request queues, audit proof rows. Those call `eraseAccount`; they are not generated.

XML attributes and samples: [`code-generation.md`](./code-generation.md#account-erasure-dsar). Walker details: [`patterns/account-deletion.md`](./patterns/account-deletion.md).

## Perspective safety

Fields grouped with `perspective="Info"` generate `Entity.InfoPerspective`, `asInfoPerspective()`, and `manager.updateInfoPerspective(perspective)`.

That write is a targeted `$set` / `$unset` of **exactly those fields**, with that perspective’s own sanitize / validate / pre / post hooks. Two writers can update `Info` and `Status` without last-write-wins clobbering the other group.

Rules that make it safe:

- **Custom code updates through perspectives** (one, or several in sequence). Do not call `manager.replace(...)` unless the call site documents an approved reason. Generated admin CRUD still uses `replace` as a raw DB-access endpoint.
- **`insert` and `replace` still fire every perspective’s mutation hooks**, so perspective logic sees every path that touches its fields.
- **Calculation inputs** come from `CalculationSource` (`recalculate="true"` fields). Reading arbitrary values off `source.getActual()` bypasses change detection and can leave calculations stale. `getActual()` is for tenant routing only.

If the field you need is not in a perspective, add `perspective="..."` in XML and regenerate.

## Calculated fields

Derived values are schema fields, not controller afterthoughts. `calculated="self"` is computed from the same document; `calculated="other"` fetches another entity or external value. Inputs that should trigger a fold get `recalculate="true"`.

The generated fold is:

```text
calculateAndPersist(document)
  → calculate(document) → applyCalculations(source, destination)
  → $set only calculated fields + calculation_utc / calculation_agent
```

Implement `applyCalculations` on `*.manager.ts`. Assign outputs to `destination.*`. On failure the document is marked dirty again (`calculation_utc = null`) so callers cannot treat a failed fold as success.

A common form is a **computed reference**: store `thing_id` plus `thing: Thing.Reference` so lists show a name without loading the full related row. Prefer the generated projected getter (`thingManager.getByIdReference(...)`) over loading the full entity and calling `.toReference()`.

Dirty rows (`calculation_utc = null`) are folded in the background by `EntitySynchronizerService`. Writes that need the new values immediately call `calculateAndPersist` on the write path.

Details: [`patterns/calculated-fields-and-references.md`](./patterns/calculated-fields-and-references.md).

## Automatic dependency management

Relationships are XML, not a web of hand-written listeners. The generator emits existence checks, delete blocking, and freshness:

| Attribute | Direction | Behavior |
|-----------|-----------|----------|
| `foreignKey` | child → parent | `validateExistence` on write; `validateNoReferences` blocks delete unless `force` |
| `fakeForeignKey` / `detachedForeign` / `softForeignReason` | — | Relax or skip those checks (cross-tenant, display-only, documented soft refs) |
| `iInvalidateForeignKey` | child write → parent | Generated `DependencyCoordinator.on{Child}Changed` sets parent `calculation_utc = null`. **Never fails the child write** — stale/dirty parent beats a failed insert |
| `foreignKeyInvalidatesMe` | parent write → children | Dependents that snapshot this parent are marked dirty |
| `foreignKeyComputesMe` | child write → parent | Eager `cascadeSynchronize` / `calculateAndPersist` on the parent (cycle-guarded) |
| `foreignKeyInvalidationCascadesToMe` | longer chain | Invalidation continues to the next hop |

The coordinator is rewritten from `nest.dependency.xsl` on every run. You declare the edge; you do not subscribe to it in product code.

## Projection performance (and leak control)

A `<projection>` is both a TypeScript type (`Widget.Public`) **and** a Mongo field mask (`Widget.Public.Projection`). Generated getters (`getById`, `getByIdPublic`, `findPublic`, `getByIdReference`) pass that mask into `.select(projection).lean({ getters: true })`. The database never ships fields you did not ask for.

Consequences:

- List/detail APIs stay cheap: a `Reference` projection is `_id` + display fields, not the whole aggregate.
- Calculated-reference lookups should use the projected getter — that is the perf path, not a style preference.
- The full-entity `Projection` **omits `searchable`** so the concatenated search blob does not leak on ordinary reads.
- The same mask is the leak boundary: E2E `expectStrictResponseShape` fails extra JSON keys TypeScript would allow.

`get="true"` on a projection emits the specialized getter. Without it you still have the type; you do not have the query.

## Localized content

The ordinary field is the default language. Other languages are an embedded array beside it. `LocalizedText` fills a string (`title` ← `text`). `LocalizedContent` fills a body of sections (`description` ← `contents`, both `ContentSection[]`).

Generated admin CRUD returns that pair as stored. It does not take a language. There is no generator attribute for the swap: a feature endpoint loads the full document, copies it, writes the matching language onto the default fields, and returns a projection that includes those fields and omits the arrays. A missing language leaves the stored default. The copy is not saved.

This clone's example is `POST /api/v1/widgets/get`. Intro: [`docs/intro/localized-content.md`](../../../docs/intro/localized-content.md). Pattern: [`patterns/localized-content.md`](./patterns/localized-content.md).

## Identity, tenancy, and access

**Jurisdiction is a first-class tenant**, not a filter you remember to add. Every document entity declares `tenant`:

| Value | Meaning |
|-------|---------|
| `Isolated` | Data lives in a jurisdiction database; `jurisdiction_id` is on the document and admin routes |
| `Shared` | Global reference data (roles, timezones, settings) |
| `Route` | The jurisdiction record itself |

User `/v1/*` routes take jurisdiction from `request.account.jurisdiction_id`, not from the caller body. Admin and federation routes may take it from the path by design.

**Identity is split on purpose.** Shared `GlobalAccount` maps an auth identifier to a home jurisdiction; Isolated `Account` holds the local profile. Login/register resolve shared then local so PII does not all live on the shared cluster. Erasure deletes Isolated data through the generated plan, then the shared mapping via `accountDeletion="custom"` / `deleteByAuthIdentifier`. (`local_account_id` dual-homed rows are a Stencil pattern for cross-jurisdiction copies; this clone’s XML does not include that entity style yet — use `paired` when you add them, do not invent a parallel.)

**Auth is pluggable.** `AccessControlModule` uses Firebase when `FIREBASE_PROJECT_ID` is set, otherwise a local HS256 provider (`POST …/dev-token`). Same guards, same JWT claims (`jurisdiction_id`, `account_id`). Local and tests do not require Firebase.

**Admin APIs have a second door.** All `/api/admin/*` require `X-Admin-Token` (`ADMIN_GATE_TOKEN`) in addition to JWT + role. Production docs add Cloudflare Access in front of the admin SPA.

**RBAC is a domain model, not a decorator convention.** Permission strings are generated from entities (`AppPermissions.Admin.Widget.Read` / `.Write`). `Role` is a Shared aggregate that stores the grant list; `Account.PermissionsPerspective` is how roles are assigned; `RoleManager.hasPermissionCached` is the domain query. HTTP `AuthGuard` + `@Permission(...)` and the admin UI `AuthorityCheck` / `AuthorityGuard` are adapters over that query — they do not invent a second ACL. Feature controllers use the same `AppPermissions` constants. Adding an entity adds permission vocabulary and generated admin guards; `RoleSyncService` hydrates the admin role from `AppPermissions` and **excludes `Role.Write`** so role-sync cannot self-escalate.

## Input, output, and leak control

- **Sanitize at the HTTP boundary.** Every feature `@Body()` uses `Sanitize.for(Class)` (validators generated as `*.sanitized.validators.ts`) or an explicit `Sanitize.ignore()` for webhooks/external envelopes. Bare `@Body()` is a hard rule violation. System fields cannot be smuggled in from the client.
- **Typed envelopes.** Controllers return `ItemResult<T>`, `ListResult<T>` (stepping and paging), or `ActionResult` — not raw documents.
- **Friendly, localizable errors.** `UIException` carries `LocalizableString`; `FriendlyExceptionFilter` returns a client-safe message (business errors as HTTP 200 + message) and logs unexpected failures without leaking internals.
- **Response shape tests.** E2E `expectStrictResponseShape` walks JSON against the sanitize registry. `developers/VERIFICATION.md` treats extra fields as an invariant failure. (The Mongo-side of projections is [above](#projection-performance-and-leak-control).)
- **ISO dates become `Date`s** via a global interceptor, so JSON round-trips do not silently stay strings.

## Encryption and object storage

- **Queryable, at rest.** Field `encrypted="true"` drives MongoDB Queryable Encryption (CSFLE) via AWS KMS. Collection definitions carry `encryptedFields`; the connection provider builds the auto-encryption map (`mongo-queryable-encryption.ts`). This clone may omit live encrypted fields so in-memory Mongo works; the pipeline remains.
- **Field encrypt hooks.** `encryption="…"` emits `prepareEncryptionFields` on insert/replace.
- **In transit (designed topology).** HTTPS end-to-end: Cloudflare Full (Strict) to origin ALBs, Atlas over TLS / PrivateLink, federation over HMAC-signed HTTPS. See developers README — IaC for that topology is not in this clone.
- **Multi-cloud blobs.** Jurisdiction-scoped storage providers for AWS S3, Azure Blob, and GCS. Product media APIs (`prepare` / `complete` + `PreSignedUrl`) do not care which cloud is configured.
- **Upload hygiene.** Magic-byte validation (not Content-Type trust); encrypted assets use a dedicated envelope and path (`…/encrypted/…/.enc`) with header checks; Sharp resize (small/large) runs on the tasks slice, not the request path. Stale orphan objects are cleaned on a schedule.

## Search, indexes, derived state, migrations

- **Keyword search from XML.** `searchable="true"` fields build a divided lowercase blob and a collated `default_searchable_en_v1` text index. Admin list search is generated, not a per-entity query.
- **Schema-owned uniqueness and TTL.** `<uniquekey>` and `<index ttl="true">` emit Mongo indexes from `ensureIndexes`. A background `MongoIndexService` re-applies them on an interval so new jurisdictions and new XML indexes converge without a one-off ops script.
- **Shard keys** (`<shard>`) sit next to the entity so placement follows the schema.
- **UUIDs stay strings in app code.** A Mongoose plugin converts BSON Binary ↔ string on the way in and out.
- **Per-jurisdiction schema upgrades.** Versioned scripts (`JurisdictionSchemaVersion` + `tasks/jurisdiction-schema/`) run as scheduled or manual tasks — tenant migrations as code, not ad-hoc shell. Prefer additive nullable XML so those upgrades are rare.

Isolated vs Shared chooses the Mongo **connection** at the manager. Tenancy is both a security property (jurisdiction on the document and the route) and a data-placement property (which cluster, which shard key).

## Abuse control, health, and background work

- **Rate limiting never fails open.** `@RateLimit` + `RateLimitGuard` on authenticated feature routes. Redis (`REDIS_URL` / ElastiCache) when configured; on Redis failure the service falls back to in-memory limiters and reconnects. Keys are JWT `sub` or client IP (`CF-Connecting-IP`). Local without Redis is per-instance, still enforced.
- **Health and metrics.** Public `/health` (DB ping once, then cheap); authenticated `/platform/health`; Prometheus `/metrics` plus `HttpMetricsInterceptor` histograms on `/v1/*` labeled by jurisdiction; build SHA gauge.
- **Config from secrets.** `ConfigResolver` can read AWS Secrets Manager (env-only is the local default).
- **Hot-path cache.** `MemoryCache` is an in-process TTL map. It coalesces in-flight fetches for role permissions, settings, account resolution, and storage signatures. Intro: [`docs/intro/memory-cache.md`](../../../docs/intro/memory-cache.md).
- **Ops tasks on the scheduler slice** (same image, `SCHEDULER_ENABLED=true`): index sync, entity recalculation, image resize, asset orphan cleanup, cache cleanup, Mongo connection prune, role sync (admin role hydrated from `AppPermissions`), jurisdiction schema upgrades. Non-prod `GET /platform/bootstrap` seeds roles, timezones, and jurisdictions.

## Observability and privacy

- Grafana Alloy sidecar on each Fargate task scrapes `/metrics` and remote-writes to Grafana Cloud (production topology).
- Nest `Logger` on managers, tasks, and the generated dependency coordinator (invalidation failures are warnings, not writer failures).
- **Stable identifiers stay out of logs.** Full Firebase UID / `auth_identifier` / JWT `sub` must be truncated. Log aggregators are an exfil path; this is a hard rule (`privacy-logging.mdc`, `VERIFICATION.md`).
- In-memory Mongo for local and E2E when SHARED URI is unset (`mongodb-memory-server`, one DB per tenant). Queryable encryption is skipped on that path by design.

## Sliceable deployments

The same image runs in different roles by configuration:

- **API vs background tasks.** `TasksModule.forRoot()` loads `ScheduleModule` only when `SCHEDULER_ENABLED=true`. Production runs a separate ECS tasks service so cron work does not sit on the request path. Tests omit the scheduler.
- **Frontend vs API.** Separate Dockerfiles and ALBs (`admin.*` vs `api-{region}.*`).
- **Feature surface.** `uiGenerate="false"`, `noCreateApi` / `noReplaceApi` keep unused CRUD out of a product slice.
- **Federation mode.** `FEDERATION_MODE=development` is one process, all jurisdictions, direct Mongo. Production mode is `federated`. This clone keeps that switch and `docker-compose.federation.yml`; the HMAC peer client was stripped (`JurisdictionMismatchInterceptor` is a placeholder). Dual-homed writes, tombstones (`deleted_utc`), and GDPR physical delete via the schema-owned erasure registry remain the Stencil contract — apply them from XML rather than inventing a second sync model.

Designed production topology (docs, not IaC in this clone): Cloudflare WAF + Full Strict TLS, origin certs, Cloudflare IP prefix list on ALBs, Atlas PrivateLink, HMAC key rotation via Secrets Manager + Lambda, GitHub Actions to all regions via AWS OIDC.

## Related reading

- Production topology: [`developers/README.md`](../developers/README.md)
- Rate limits: [`developers/rate-limiting.md`](../developers/rate-limiting.md)
- Invariants: [`developers/VERIFICATION.md`](../developers/VERIFICATION.md)
- Federation / dual-homed / tombstones: [`patterns/federation-and-dual-homed.md`](./patterns/federation-and-dual-homed.md)
- Account erasure (DSAR): [`patterns/account-deletion.md`](./patterns/account-deletion.md)
- Feature controllers: [`patterns/feature-controllers.md`](./patterns/feature-controllers.md)
- Calculated fields / computed references: [`patterns/calculated-fields-and-references.md`](./patterns/calculated-fields-and-references.md)
- Localized content: [`patterns/localized-content.md`](./patterns/localized-content.md)
- Extending managers: [`patterns/extending-generated-code.md`](./patterns/extending-generated-code.md)
- XML contract: [`code-generation.md`](./code-generation.md)
