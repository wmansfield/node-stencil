# Webhook Ingestion

Pattern for accepting third-party webhooks reliably without doing domain work in
the public request path.

Use a two-phase queue:

1. **Intake** accepts the HTTP POST, authenticates it, stores the raw payload as a
   queue record, and returns `200` quickly.
2. **Processing** drains pending queue records later, parses the payload, applies
   domain changes, and marks each record processed.

This keeps provider retries, backpressure, and slow downstream work away from the
webhook endpoint.

## When to use

- A third party must be able to deliver an event even when your app is busy or a
  downstream dependency is temporarily failing.
- Duplicate deliveries should be harmless.
- You want a processor that can be run on a schedule, from an internal admin
  action, or both.

## Components

| Component | Typical location | Generated? |
|---|---|---|
| Queue entity | `generation/xml/stencil-entities.xml` | Yes |
| Intake controller | `backend/src/features/<area>/<feature>/<feature>-webhook.controller.ts` | Hand-written |
| Payload types | `backend/src/features/<area>/<feature>/types/*.types.ts` | Hand-written |
| Feature module | `backend/src/features/<area>/<feature>/<feature>.module.ts` | Hand-written |
| Manager helpers | `backend/src/entities/webhookevent/webhookevent.manager.ts` | ENSUREFILE |
| Processor service | `backend/src/tasks/<feature>-webhook.service.ts` | Hand-written |
| Manual trigger route | `backend/src/tasks/tasks.controller.ts` + optional XML feature mutation | Hand-written/generated contract |

Names are placeholders. Use names that match the provider or domain event, such
as `WebhookPayment`, `WebhookSubscription`, or `WebhookEvent`.

## 1. Queue Entity

Declare a small queue entity in XML and run the generator. For a bare-bones app,
`tenant="Shared"` is usually enough because webhook delivery is app-wide. If your
app is multi-tenant, carry the tenant/account identifier on the route or payload
and resolve it during processing.

Useful fields:

- `_id`: a UUID, or the provider event id when it is globally unique.
- `event_id`: optional provider event id, marked as an id alias or unique index
  when you want natural deduplication.
- `raw_payload`: the verbatim request body, with no max length when payloads may
  vary.
- `received_utc`: when the webhook arrived.
- `processed_utc`: `null` means pending.
- `process_result`: short status such as `ok` or `failed: <reason>`.
- `process_log`: optional truncated log for diagnostics.
- `purge_utc`: optional TTL field for processed-record cleanup.

Add an index for the drain query, typically `(processed_utc, received_utc)`.

## 2. Intake Controller

The intake controller should be intentionally small:

- Use a route such as `platform/webhooks/<provider>` or
  `v1/webhooks/<provider>`.
- Use `@Body(Sanitize.ignore())`; provider payloads are not Stencil entities.
- Authenticate with provider-specific credentials, usually a shared secret or
  signature header from config.
- Add `@RateLimit(...)` and `RateLimitGuard`.
- Return `200` after the queue write succeeds.
- Exclude the route from normal JWT/auth middleware if it is under a protected
  path.

Do not apply business logic in this controller. Persist the payload and let the
processor handle validation, lookups, and domain writes.

## 3. Manager Helpers

Add queue-specific helpers in the generated entity's ENSUREFILE manager:

- `upsertWebhook(doc)`: insert the queue record and swallow duplicate-key errors
  so duplicate deliveries are idempotent.
- `findPendingWebhooks(limit)`: return records where `processed_utc` is `null`,
  sorted by `received_utc`.
- `markProcessed(id, result, log?)`: set `processed_utc`, `process_result`,
  optional `process_log`, and optional `purge_utc`.

Use the generated manager's shared/tenant-scoped helpers that match the queue
entity's tenant model.

## 4. Processor Service

Implement an injectable task service that can be called manually and, if your app
uses `@nestjs/schedule`, on an interval.

Recommended shape:

- Keep an `isRunning` guard so two drains do not overlap.
- Keep an `isShuttingDown` flag if the service may run during app shutdown.
- Expose `triggerProcess()` for manual/admin calls.
- Add `@Interval(...)` or `@Cron(...)` only when the app has scheduling enabled.
- In the private drain loop, catch errors per record and mark the failed record
  processed with a useful result/log.

One malformed webhook should not stall the entire queue.

## 5. Scheduling

If scheduled processors are enabled by environment, keep the switch central:

```ts
const enableScheduler = process.env.SCHEDULER_ENABLED === 'true';
if (enableScheduler) imports.push(ScheduleModule.forRoot());
```

With this pattern, API instances can leave `SCHEDULER_ENABLED` unset while a
dedicated worker instance sets it to `true`. Manual trigger routes still work as
long as the task service is registered.

## 6. Manual Trigger

For an internal manual trigger:

- Add a feature mutation in XML if you want generated client API support.
- Implement the matching `@Post(...)` route in `tasks.controller.ts`.
- Protect it with the app's normal internal/admin permission.
- Call `service.triggerProcess()` and return an action result.

## Idempotency and Lifecycle

| Stage | Mechanism |
|---|---|
| Duplicate delivery | Unique event id plus duplicate-key handling |
| Re-processing | Processors only read records where `processed_utc` is `null` |
| Failure | Failed records are marked processed with a diagnostic result |
| Replay | Clear `processed_utc` manually or insert a new event, depending on policy |
| Cleanup | Optional `purge_utc` TTL index removes old processed records |

## Testing

Unit-test the processor directly with mocked managers or a mocked
`EntityRegistry`. Cover:

- Empty queue.
- Happy path.
- Duplicate delivery.
- Malformed payload.
- Missing referenced entity or tenant/account.
- Per-record failure isolation.
- `isRunning` overlap guard.

Integration-test the intake route when authentication/signature validation is
non-trivial.
