# AI Ruleset And Strictness

This file maps the repository's AI guidance into strictness levels so agents can decide what to read and what must be enforced.

## Strictness Levels

| Level | Meaning | Examples |
| --- | --- | --- |
| Hard Rule | Must be followed. Violations risk data loss, security/privacy bugs, sync drift, or generated-code churn. | Generated file ownership, dual-homed `local_account_id`, feature body sanitization, tombstones, privacy logging. |
| Contextual Rule | Must be followed when touching the matching surface. | Feature controller guard/rate limit shape, response envelopes, federation broker writes, frontend generated artifacts. |
| Review Checklist | Verify before finishing work in that area. | E2E coverage, response shape leakage, `VERIFICATION.md` invariants, generator run after XML edits. |
| Background Reference | Read when entering the domain, but do not load for every task. | Product overview, sharing model, deployment docs, jurisdiction counsel docs. |

## Hard Rules

- **Generated code ownership:** schema, enums, projections, feature contracts, indexes, tenant/account-deletion metadata, and generated client APIs are XML-first. Edit `../generation/xml/stencil-entities.xml`, run the generator, then customize only extension files.
- **Never edit STARTFILE output:** `*.model.ts`, `*.schema.ts`, `*.manager.base.ts`, `*.controller.base.ts`, `list-input-*.ts`, `*.sanitized.validators.ts`, generated app/frontend model/API files, `entity.module.ts`, `entity.registry.ts`, and `account-deletion-manager.ts`.
- **Dual-homed reads:** when selecting one perspective for dual-homed entities (those with `local_account_id` / `remote_account_id` pairs), include `local_account_id` in the query.
- **Feature bodies:** every `@Body()` in `backend/src/features/**/*.controller.ts` must use `Sanitize.for(...)` or an explicit `Sanitize.ignore()` for webhooks/externally-shaped payloads.
- **Sync/federated deletion:** normal business flows use `deleted_utc` tombstones plus `edited_utc` cascade where applicable. Hard deletes are for explicit GDPR/DSAR/account-deletion processors.
- **Interface contracts:** add required behavior to the named interface or narrow to a concrete type. Do not add inline optional methods at call sites.
- **Privacy logging:** never log full Firebase UID, `auth_identifier`, JWT `sub`, or RevenueCat app user IDs. Avoid the identifier or truncate consistently.

## Contextual Rules

- **User feature routes:** derive jurisdiction from `request.account.jurisdiction_id`, not route/body values. Route/body jurisdiction is for admin, federation, bootstrap, public legal, webhook, or carefully documented cross-jurisdiction flows.
- **Feature controller shape:** authenticated user endpoints use `AuthGuard`, `RateLimitGuard`, and `@RateLimit(...)`; most user reads are `POST` plus `@HttpCode(200)`.
- **Response contracts:** user APIs should return `ItemResult<T>`, `ListResult<T>`, or `ActionResult` unless intentionally using `UIException`/HTTP exceptions or webhook ack shapes.
- **Federated writes:** use `FederatedEntityBroker`, `FederationUtils.insertAndHealDualHomed`, and full `IFederatedEntityManager` implementations. `findUnreplicated` excludes self rows.
- **Generated feature models:** request/response models under `backend/src/features/**/models/` may be generated. Check before editing; usually change XML and regenerate.
- **Frontend/admin generated output:** generated API/model files are not customization points. Admin CRUD views and pickers may be ENSUREFILE customizations when generated that way.

## Review Checklists

- After XML edits, confirm the generator ran and only intended STARTFILE diffs changed.
- For new or changed user feature endpoints, check sanitization, auth, rate limiting, response envelope, response projection, and E2E coverage.
- For federation/sync changes, check perspective scoping, broker routing, tombstone semantics, reconciliation paths, and mobile delta-sync behavior.
- For security-sensitive changes, check `developers/VERIFICATION.md` for matching invariants and update it when adding a new invariant.

## Background References

- `ai/product-overview.md` for template architecture and customization guidance.
- `developers/README.md` for deployment and production operations.
- `developers/rate-limiting.md` for limit choices.

## Task Recipes

### Add Or Change An Entity Field

1. Edit the entity in `../generation/xml/stencil-entities.xml`.
2. Run `cd ../generation/tools && ./code-generator-cli.exe`.
3. Update extension logic in `*.manager.ts`, feature controllers, tests, and docs as needed.

### Add Or Change A User API Contract

1. Edit the XML `<feature>` request/response/route definition.
2. Run the generator.
3. Implement or update the hand-written backend controller under `backend/src/features/`.
4. Use `Sanitize.for(RequestClass)`, `request.account`, rate limiting, and typed result envelopes.

### Change Federated Or Dual-Homed Behavior

1. Identify whether the operation is local perspective read, federated hydration, dual-homed write, tombstone, or GDPR hard delete.
2. Use `local_account_id` for perspective reads.
3. Use broker/federation utilities for cross-jurisdiction writes.
4. Ensure reconciliation and delta-sync semantics still have an explicit signal.
