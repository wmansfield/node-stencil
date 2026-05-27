# Federation And Dual-Homed Entities

Dual-homed entities store one row per perspective. In single-jurisdiction development both rows may live in the same collection, so grouping-only queries can return duplicates.

When you add dual-homed entities to your schema, they typically include `local_account_id`, `remote_account_id`, and related jurisdiction fields. Examples in other codebases include share links, participants, connections, and messages — the pattern is the same regardless of domain name.

## Read Pattern

Use `local_account_id` whenever selecting the caller's perspective.

```typescript
const filter = {
   parent_id,
   local_account_id: account_id,
};
```

Grouping-only filters such as `{ parent_id }` are only valid when intentionally enumerating all perspectives, such as owner-side fan-out, DSAR export, or documented cleanup logic.

## Write Pattern

Federated writes use the manager contract and broker utilities:

- `IFederatedEntity` for the perspective row shape
- `IFederatedEntityManager<T>` for required manager behavior
- `IFederatedEntityFactory<T>` for local/remote clones
- `FederatedEntityBroker<T>` for local-vs-remote routing
- `FederationUtils.insertAndHealDualHomed(...)` for dual-write, heal, and rollback

Every `IFederatedEntityManager` method is required. Do not add optional methods inline at call sites; add behavior to the interface or narrow the call site to a concrete manager.

## Reconciliation

Rows whose remote write may have failed have `replicated_utc` unset. `findUnreplicated` implementations must exclude self rows:

```typescript
const filter = {
   replicated_utc: { $exists: false },
   $expr: { $ne: ['$local_account_id', '$remote_account_id'] },
};
```

Some entity pairs need a `target_id` (or similar grouping field) to disambiguate repeated relationships between the same accounts.

## Deletes And Tombstones

Normal federated or mobile-sync deletion is a tombstone:

- set `deleted_utc`
- bump `edited_utc` when the entity uses delta sync
- bump `updated_utc`
- cascade the edit timestamp where sibling rows or mobile clients depend on it

Do not use physical deletes or `upsert` to repair federated drift in normal business flows. Physical deletion is reserved for explicit GDPR/DSAR/account-deletion processors.

## Hydration

When a response needs data from the parent or remote account, fetch it from the owning jurisdiction through federation services instead of copying PII across jurisdictions. Public profile fragments are transient response hydration, not durable replication.
