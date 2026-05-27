# Verification Guide

Use this file before finishing work that changes backend behavior, generated contracts, federation, security, or user-facing API responses.

## Primary Checklist

`developers/VERIFICATION.md` is the source for repository invariants that can be manually or programmatically checked. Update it when you add a new invariant that future agents should verify.

## When To Run Checks

- Entity/XML change: run the generator, then check generated diffs and impacted extension code.
- User feature controller change: check auth, rate limiting, `Sanitize.for(...)`, response envelopes, projection shape, and E2E coverage.
- Federation/sync change: check `local_account_id` perspective scoping, broker routing, tombstones, reconciliation, and delta-sync response behavior.
- Security/privacy change: check logging, identifier truncation, jurisdiction routing, and response field leakage.
- Docs/rules-only change: verify `.mdc` frontmatter and links; run markdown formatting/lint only if the repo provides it.

## Test Commands

From `server/api`:

```bash
npm run build
npm test
npm run test:e2e
```

From `server/api/backend`:

```bash
npm run build
npm test
npm run test:e2e
```

Use the narrowest command that covers the risk of the change. For docs-only work, code tests are usually unnecessary unless examples or generated workflow claims changed.
