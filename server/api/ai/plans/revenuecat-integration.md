# RevenueCat Integration Plan

> Historical plan: this document records the original implementation approach and may contain stale paths or tier names. For current RevenueCat setup and operational guidance, use `../../docs/revenuecat-setup.md` and the live code under `backend/src/features/revenuecat/`.

## Overview

Integrate RevenueCat for purchase/subscription management with a "webhooks as signals, not state" architecture.

**Philosophy:**
- After purchase, app immediately calls our API
- Our API directly queries RevenueCat for the latest state (source of truth)
- Update AccountEntitlement with current subscription info
- Return updated info to app
- Webhooks are stored and processed asynchronously as a queue (trigger re-syncs)
- App falls back to RevenueCat state if distributed transaction fails (edge case)

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| App User ID | Firebase UID (`auth_identifier`) | Mobile app has this, both sides can map |
| Webhook Entity Tenant | **Shared** | RevenueCat is app-wide, webhooks arrive without jurisdiction context; resolve during processing |
| Tier Model | Highest active wins | Tiers build upon each other (free < standard < max) |
| Event Deduplication | Use RevenueCat `event_id` as `_id` | Natural deduplication via unique constraint |
| Tier Mapping | Enum with matching RevenueCat product codes | Hardcoded initially, GlobalSettings JSON fallback if needed |
| Webhook Auth | Authorization header (shared secret) | IP restriction ignored (behind Cloudflare) |
| Rate Limiting | Organic via product UX | Future API layer for defense |

---

## Multi-Jurisdiction Handling

RevenueCat is configured per app (single RevenueCat project). Webhooks arrive at one endpoint regardless of which jurisdiction the user belongs to.

**Flow:**
1. Webhook arrives with `app_user_id` = Firebase UID
2. Store webhook in **Shared** collection (no jurisdiction lookup at storage time)
3. During processing: lookup `GlobalAccount` by `auth_identifier` (Firebase UID)
4. GlobalAccount provides `jurisdiction_id` → lookup/update `AccountEntitlement` in correct jurisdiction

This keeps webhook storage fast and moves account resolution to controlled processing time.

---

## Architecture Components

### 1. RevenueCat Webhook Entity (Shared Tenant)
Stores incoming webhook events as a processing queue. Uses RevenueCat's `event_id` as `_id` for natural deduplication.

**Fields:**
- `_id`: string (RevenueCat event_id - prevents duplicates)
- `event_type`: string (e.g., "INITIAL_PURCHASE", "RENEWAL", "CANCELLATION", etc.)
- `app_user_id`: string (Firebase UID - used to resolve account during processing)
- `product_id`: string | null
- `event_utc`: Date (when event occurred in RevenueCat)
- `raw_payload`: string (JSON stringified webhook body)
- `processed_utc`: Date | null (null = pending)
- `process_result`: string | null (success/error message)
- `received_utc`: Date
- `purge_utc`: Date | null (set after processing for TTL cleanup)

**Indexes:**
- `by_pending`: (processed_utc ASC, received_utc DESC) - for queue processing (most recent first)
- `by_app_user`: (app_user_id ASC, received_utc DESC) - for clearing older signals
- `purge_utc`: TTL index for auto-deletion

### 2. RevenueCat Integration Service
A service that communicates with RevenueCat's REST API to fetch current subscription state.

**Location:** `backend/src/features/platform/revenuecat/`

**Files:**
- `revenuecat.service.ts` - API client
- `revenuecat.types.ts` - TypeScript interfaces for RevenueCat responses
- `revenuecat.module.ts` - NestJS module

**Capabilities:**
- `getSubscriberInfo(appUserId: string)`: Fetch full subscriber info from RevenueCat API
- Parse entitlements and subscriptions from response

**Configuration (env vars):**
- `REVENUECAT_API_KEY`: Secret API key for RevenueCat (V1 API)
- `REVENUECAT_PROJECT_ID`: RevenueCat project identifier
- `REVENUECAT_WEBHOOK_SECRET`: Shared secret for webhook authorization header

### 3. Account Entitlement Sync Mechanism
A service that fetches RevenueCat state and updates AccountEntitlement.

**Location:** `backend/src/features/platform/revenuecat/revenuecat-sync.service.ts`

**Sync Logic:**
1. Receive `app_user_id` (Firebase UID)
2. Lookup `GlobalAccount` by `auth_identifier` → get `jurisdiction_id` and `account_id`
3. Call RevenueCat API: `getSubscriberInfo(app_user_id)`
4. Determine highest active tier from entitlements (free < standard < max)
5. Get or create `AccountEntitlement` for account
6. Update fields:
   - `access_tier`: highest active tier
   - `tier_mode`: subscription vs lifetime vs promo, etc.
   - `current_start_utc`, `current_end_utc`: from subscription period
   - `last_verified_utc`: now
   - `provider`: "revenuecat"
   - `entitlement_json`: raw entitlements for debugging
7. Save AccountEntitlement

**Tier Resolution:**
```typescript
// Tier hierarchy (higher index = higher tier)
const TIER_HIERARCHY = ['free', 'standard', 'max'] as const;

// Active entitlements from RevenueCat mapped to our tier enum
// Highest active tier wins
function resolveHighestTier(activeEntitlements: string[]): AccessTier {
  let highest = 'free';
  for (const entitlement of activeEntitlements) {
    const tierIndex = TIER_HIERARCHY.indexOf(entitlement as any);
    if (tierIndex > TIER_HIERARCHY.indexOf(highest as any)) {
      highest = entitlement;
    }
  }
  return highest as AccessTier;
}
```

### 4. Webhook Queue Processor Task
A scheduled task that processes pending webhooks (similar to EntitySynchronizerService pattern).

**Location:** `backend/src/tasks/revenuecat-webhook.service.ts`

**Behavior:**
- Runs on interval (e.g., every 30 seconds) when scheduler enabled
- Graceful shutdown handling (like EntitySynchronizerService)
- Manual trigger endpoint via TasksController

**Processing Algorithm (Smart Signal Handling):**
```
1. Query pending webhooks: processed_utc IS NULL, ORDER BY event_utc DESC (most recent first)
2. Group by app_user_id
3. For each user's webhooks (most recent first):
   a. Process the MOST RECENT webhook only:
      - Call sync mechanism (fetches current state from RevenueCat)
      - Mark as processed with result
      - Set purge_utc (30 days)
   b. Mark ALL OLDER webhooks for same user as "superseded":
      - processed_utc = now
      - process_result = "superseded by {newer_event_id}"
      - Set purge_utc (30 days)
4. Continue to next user
```

**Why this works:**
- We always fetch CURRENT state from RevenueCat (not webhook state)
- Processing the most recent signal is sufficient
- Older signals for same user are redundant (superseded)
- Handles duplicates naturally (same event_id = same _id = upsert)
- Reduces unnecessary API calls to RevenueCat

### 5. User-Facing Endpoints

#### POST `/v1/auth/purchase-sync` (or `/v1/subscription/sync`)
Called by app immediately after a purchase.

**Request:** Optional - app can pass current RevenueCat state for extra validation
**Response:** Updated Account.Self (with current entitlement reflected)

**Logic:**
1. Get authenticated account
2. Call RevenueCat API to get current subscriber info
3. Update AccountEntitlement
4. Return refreshed account state

#### POST `/platform/webhooks/revenuecat`
Public endpoint for RevenueCat to send webhooks.

**Security:**
- Validate webhook signature/authorization header
- Rate limiting

**Logic:**
1. Validate request authenticity
2. Parse webhook payload
3. Store in RevenueCatWebhook entity (pending)
4. Return 200 OK immediately (acknowledge receipt)

---

## Implementation Phases

### Phase 1: Entity & Configuration
- [x] Update existing `WebhookRC` entity in XML (was placeholder, now full implementation)
- [ ] Review TierMode enum (add if missing or update)
- [ ] Run code generator
- [x] Add env vars to `.env.example`
- [x] Add config resolver support for RevenueCat settings (ConfigTemplates)

### Phase 2: Webhook Ingestion
- [x] Create `platform/revenuecat/` feature folder
- [x] Implement webhook controller (public endpoint)
- [x] Validate authorization header
- [x] Store webhook with event_id as _id (upsert for deduplication)
- [ ] Test webhook receipt

### Phase 3: RevenueCat API Client
- [x] Implement RevenueCatService (API client)
- [x] Define TypeScript types for RevenueCat responses (`types/revenuecat-api.types.ts`)
- [ ] Test fetching subscriber info

### Phase 4: Account Sync Mechanism
- [x] Implement RevenueCatSyncService
- [x] Lookup GlobalAccount by auth_identifier
- [x] Resolve highest active tier (tier hierarchy: free < standard < max)
- [x] Update AccountEntitlement (create or replace)
- [x] Handle edge cases (missing accounts, no entitlements → defaults to free)

### Phase 5: Queue Processor Task
- [x] Create RevenueCatWebhookService in tasks
- [x] Implement smart queue processing (most recent first, supersede older)
- [x] Add to TasksModule (with RevenueCatModule import)
- [x] Add manual trigger endpoint to TasksController (`POST /platform/tasks/webhooks`)

### Phase 6: User Purchase Endpoint
- [x] Add `POST /v1/subscription/sync` endpoint (new `SubscriptionController`)
- [x] Integrate with sync mechanism (`RevenueCatSyncService.syncByAuthIdentifier`)
- [x] Return `SubscriptionSyncResponse` with tier, mode, dates

---

## Entity Definition (XML)

**Updated existing `WebhookRC` entity** in `server/generation/xml/stencil-entities.xml`:

```xml
<!-- RevenueCat Webhook Queue - Shared tenant (app-wide, jurisdiction resolved during processing) -->
<item name="WebhookRC" friendlyName="RevenueCat Webhook" tenant="Shared" useDocument="true" uiDefaultSort="received_utc">
   <field type="string" isNullable="false" maxLength="100" friendlyName="Id">_id</field>
   <field idAlias="true" type="string" isNullable="false" maxLength="100" uiList="true" friendlyName="Event ID">event_id</field>
   <field type="string" isNullable="false" maxLength="50" uiList="true" filter="true" friendlyName="Event Type">event_type</field>
   <field type="string" isNullable="false" maxLength="150" uiList="true" searchable="true" friendlyName="Auth Identifier">auth_identifier</field>
   <field type="string" isNullable="true" maxLength="100" uiList="true" friendlyName="Product ID">product_id</field>
   <field type="Date" isNullable="false" uiList="true" sortable="true" friendlyName="Event Time">event_utc</field>
   <field type="string" isNullable="false" maxLength="none" html="true" truncateLog="true" friendlyName="Raw Payload">raw_payload</field>
   <field type="Date" isNullable="true" uiList="true" sortable="true" perspective="Process" friendlyName="Processed">processed_utc</field>
   <field type="string" isNullable="true" maxLength="500" perspective="Process" friendlyName="Process Result">process_result</field>
   <field type="Date" isNullable="false" uiList="true" sortable="true" friendlyName="Received">received_utc</field>
   <field type="Date" isNullable="true" friendlyName="Purge">purge_utc</field>
   <!-- Queue processing: pending items, most recent event first -->
   <index name="by_pending">
      <entry direction="Ascending">processed_utc</entry>
      <entry direction="Descending">event_utc</entry>
   </index>
   <!-- Lookup by user: for superseding older signals -->
   <index name="by_auth_identifier">
      <entry direction="Ascending">auth_identifier</entry>
      <entry direction="Descending">event_utc</entry>
   </index>
   <!-- TTL auto-cleanup after processing -->
   <index name="purge_utc" ttl="true">
      <entry direction="Ascending">purge_utc</entry>
   </index>
   <shard>
      <entry kind="hashed">_id</entry>
   </shard>
</item>
```

**Note:** The `_id` field is set to RevenueCat's `event.id` (via `event_id` idAlias) when storing webhooks. This provides natural deduplication - if the same event is received twice, the second insert becomes an upsert.

---

## Configuration Requirements

### Environment Variables (.env)
```bash
# RevenueCat API
REVENUECAT_API_KEY=sk_xxxxx          # V1 API secret key
REVENUECAT_PROJECT_ID=app_xxxxx      # Project identifier
REVENUECAT_WEBHOOK_SECRET=whsec_xxx  # Webhook authorization header value
```

### RevenueCat Setup (in RevenueCat dashboard)
1. Set app user ID to Firebase UID when initializing SDK in mobile app
2. Create entitlements named: `standard`, `max` (matching our enum)
3. Configure webhook URL: `https://api.example.com/platform/webhooks/revenuecat`
4. Set webhook authorization header to match `REVENUECAT_WEBHOOK_SECRET`

---

## Existing Types Reference

**access_tier** (string union in AccountEntitlement model):
- `'free'` | `'standard'` | `'max'`

**TierMode enum** (already exists):
- `active` (0) - actively subscribed
- `grace` (1) - grace period after failed payment
- `trial` (2) - free trial

---

## Open Items

1. **Entitlement names in RevenueCat:** Confirm entitlement identifiers are `standard` and `max` (matching our access_tier values)

2. **TierMode extension:** May need to add values later:
   - `lifetime` - one-time purchase with lifetime access (if we offer this)
   - `promotional` - granted via promo code

---

## Session Log

- **2026-01-30:** Initial plan created after reviewing project structure and patterns.
- **2026-01-30:** Updated based on feedback:
  - Changed to Shared tenant for webhooks (jurisdiction resolved during processing)
  - Using Firebase UID (`auth_identifier`) for cross-system mapping
  - Using RevenueCat event_id as _id for natural deduplication
  - Smart queue processing: most recent first, supersede older signals
  - All timestamps as Date (UTC), not int
  - Authorization header for webhook security (no IP restriction)
  - Tier hierarchy: highest active wins
- **2026-01-30:** Phase 1 implementation started:
  - Updated existing `WebhookRC` entity in XML (was placeholder)
  - Added RevenueCat config to `.env.example`
  - Added config templates for RevenueCat settings
  - User added `process_attempt_utc` and `process_log` fields (self-documenting records)
  - Code generation completed
- **2026-01-30:** Phase 2 completed:
  - Created `backend/src/features/platform/revenuecat/` folder
  - Created webhook types (`types/revenuecat-webhook.types.ts`)
  - Created webhook controller with auth validation
  - Extended `WebhookRCManager` with `upsertWebhook`, `findPendingWebhooks`, `markProcessed` methods
  - Registered `RevenueCatModule` in `app.module.ts`
  - Added webhook endpoint to middleware exclusion list
- **2026-01-30:** Phase 2 refinements:
  - Changed webhook secret caching to use MemoryCache (15-minute TTL)
  - Changed upsertWebhook to use standard insert() with duplicate key handling
  - Removed markProcessingAttempt (use updateProcessPerspective instead)
- **2026-01-30:** Phase 3 completed:
  - Created `types/revenuecat-api.types.ts` with full API response types
  - Created `RevenueCatService` with:
    - `getSubscriberInfo(appUserId)` - fetches from RevenueCat API
    - `getActiveEntitlements()` - determines active entitlements
    - `hasBillingIssues()` - checks for billing problems
    - `isInGracePeriod()` / `isInTrialPeriod()` - subscription state helpers
  - Registered service in module with export
- **2026-01-30:** Phase 4 completed:
  - Created `RevenueCatSyncService` with:
    - `syncByAuthIdentifier(authId)` - main sync entry point
    - Looks up GlobalAccount → gets jurisdiction_id and account_id
    - Fetches RevenueCat subscriber info
    - Resolves highest tier (free < standard < max)
    - Determines TierMode (active, trial, grace)
    - Creates or updates AccountEntitlement
  - Returns `SyncResult` with success, tier info, or error
- **2026-01-30:** Phase 4 refinements:
  - Added concurrency handling on insert (fetch existing on duplicate key)
  - Changed magic strings to `AccessTierString` enum
  - Fixed tier mode binding to winning entitlement's subscription (not any subscription)
  - Fixed subscription dates to use winning tier's subscription
- **2026-01-30:** Phase 5 completed:
  - Created `RevenueCatWebhookService` in tasks folder
  - Processes pending webhooks (most recent first per user)
  - Supersedes older webhooks for same user
  - Runs every 30 seconds (when scheduler enabled)
  - Added to TasksModule with RevenueCatModule import
  - Added `POST /platform/tasks/webhooks` endpoint with `tasks:webhook:sync` permission
- **2026-01-30:** Phase 6 completed:
  - Created `SubscriptionController` in `features/user/subscription/`
  - Added `POST /v1/subscription/sync` endpoint (authenticated)
  - Returns `SubscriptionSyncResponse` with access_tier, tier_mode, dates
  - Added to UserModule with RevenueCatModule import
