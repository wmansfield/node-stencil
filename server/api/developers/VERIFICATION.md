# Verification checklist

A list of **things that should be true** about the codebase. You can ask the assistant to **verify** this list: it will check each item and report what is missing or failing.

- **To verify:** Ask: _"Verify the checklist"_ or _"Run verification"_ or _"Check VERIFICATION.md"_.
- **To add items:** Edit this file and add a new bullet under the appropriate section (or a new section). Keep the **ID** short and stable so we can refer to it (e.g. `user-rate-limit`).
- **Scope:** Each item can optionally note _how_ to verify (paths, patterns, or "manual").

---

## Invariants

### `user-rate-limit` — User feature rate limiting

**Statement:** All endpoints in the user feature area (`backend/src/features/user/**`) that use `AuthGuard` (i.e. authenticated endpoints) should have rate limiting configured via `@RateLimit(...)` and `RateLimitGuard`.

**How to verify:** For each file under `features/user` that has route handlers (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`), each handler that uses `@UseGuards(AuthGuard)` should also have `@RateLimit(...)` and `RateLimitGuard` on the same handler (or on the controller if applied globally). Public/unauthenticated endpoints (no AuthGuard) are out of scope.

**Last verified:** —

### `e2e-test-coverage` — Feature controller E2E test coverage

**Statement:** Every feature controller under `backend/src/features/user/` must have a corresponding E2E test file under `backend/test/features/`. Each test file must cover three categories: (1) functional lifecycle — full add/remove/list cycles through real APIs, (2) response shape — `expectStrictResponseShape` assertions that verify no extra fields leak beyond the declared projection type at any depth, (3) auth boundary — unauthenticated requests return 4xx for every endpoint.

**How to verify:**
1. Run `git log <last-verified-hash>..HEAD -- backend/src/features/user/ backend/src/entities/*/` to find changed feature controllers and related managers since last verification.
2. For each changed controller, confirm a matching `*.e2e-spec.ts` exists in `backend/test/features/`.
3. For changed managers, confirm the related feature test exercises the affected code paths.
4. Run `npm run test:e2e` from `backend/` — all tests must pass.
5. If tests are missing or stale, AI should write/update them before marking verified.

**Coverage status:**
| Controller | Test file | Status |
|---|---|---|
| `auth.controller.ts` | `auth.e2e-spec.ts` | Covered |
| `media.controller.ts` | `media.e2e-spec.ts` | Covered |
| `profile.controller.ts` | `profile.e2e-spec.ts` | Covered |

**Last verified:** —

### `no-uid-in-logs` — Firebase UID must not appear in full in server logs

**Statement:** `auth_identifier` / Firebase UID (`sub`) is a stable, permanent, cross-system identifier. Full UIDs must **never** appear in server log output. All log statements that reference a user identity must truncate to 8 characters (e.g. `uid.slice(0, 8) + '***'`). This prevents exfiltration via log aggregators (CloudWatch, Datadog, Splunk, etc.) or compromised log access.

**How to verify:**
1. Search `backend/src/` for log statements containing `authIdentifier`, `jwt.sub`, `jwt?.sub`, `payload.sub`, `uid` interpolated into template literals.
2. Each match must use `.slice(0, 8)` truncation or equivalent — never the full value.
3. The `searchable` composite field (which includes `auth_identifier`) must **not** appear in any `Projection` block. Verify all `*.model.ts` files exclude it.

**Scope of identifiers:**
- `auth_identifier` (Firebase UID) — stored in Account, GlobalAccount
- `sub` (JWT claim) — decoded in middleware, used throughout controllers/managers
- `uid` (Firebase Admin parameter) — used in FirebaseService

**Last verified:** —

---

## Adding more items

Use this template when adding a new item:

```markdown
### `short-id` — Short title

**Statement:** One sentence describing what must be true.

**How to verify:** (optional) How to check: paths, grep patterns, or "manual".

**Last verified:** (optional)
```

Keep IDs lowercase-with-hyphens (e.g. `auth-guards-order`, `no-console-in-production`).
