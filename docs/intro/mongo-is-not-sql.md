# Mongo is not SQL

Stencil uses MongoDB (via Mongoose). Habits from tables produce slow or wrong systems if they are applied unchanged.

Stencil still has **foreign keys, unique keys, indexes, and limited atomicity**. They live in XML and in **managers**, not in a SQL engine that saves the query at read time.

## Rows vs documents

A SQL row is flat. Related data lives in other tables and you JOIN.

A Mongo **document** is a JSON-like object. Stencil XML `classOnly="true"` types (`LocalizedText`, `LocalizedContent`, `MediaInfo`, `FullDate`) are **embedded** on the parent. `title_localized` and `description_localized` are arrays on Widget, not child tables. Reading one language is a feature endpoint that copies the match onto `title` / `description`; the stored arrays stay put. See [Localized content](./localized-content.md).

| SQL instinct | Mongo / Stencil |
|--------------|------------------|
| Child table + FK | Embed a class, or store an id + a **computed reference** snapshot |
| Junction table for many-to-many | Array of ids, or a first-class join **entity** if it has its own lifecycle |
| `SELECT * FROM widget JOIN …` | `getByIdPublic` / a `<projection>` — Mongo `.select()` of named fields |
| View | Projection type (`Widget.Public`) generated from XML |
| Computed column / trigger | `calculated` field + `applyCalculations` on the manager |
| `UPDATE widget SET a=…` (one column) | **Perspective** `$set` of a named field group |
| `DELETE FROM` | Tombstone `deleted_utc` for normal removes; physical delete for GDPR only |

**Write-time vs read-time.** SQL often keeps one copy of truth and joins at read. Mongo often **denormalizes at write**: store `thing_id` and `thing: { _id, display_name }` so a list does not fetch Thing. That snapshot can go stale; XML `foreignKeyInvalidatesMe` / `iInvalidateForeignKey` marks rows dirty so a background synchronizer folds them again. You opt into freshness. You do not get it free from the engine.

## There is no join planner (as your default)

Mongo can look up other collections; Stencil does not want you to live there.

- Lists use **projections** so the database never ships unused fields (`lean` + `.select(Widget.Public.Projection)`).
- Display names of related records use **computed references**, not N+1 joins in the controller.
- `getWithin` batches ids. Do not loop `getById` in a list mapper.

If you find yourself loading the full Widget to pick two fields, you have missed a projection. How the two shapes differ: [Perspectives and projections](./perspectives-and-projections.md).

## Foreign keys are application rules

SQL: `REFERENCES parent(id)` + `ON DELETE CASCADE` (or a DBA who forbids cascade).

Stencil: `foreignKey="Thing"` on a field. The **manager** calls `validateExistence` on write and `validateNoReferences` on delete. The database will happily store an orphaned id if you bypass the manager.

Relaxations exist on purpose:

- `fakeForeignKey` — typed like an FK, not enforced (cross-store / display).
- `detachedForeign` — parent is not in this tenant; do not pass tenant fields into the check.
- `softForeignReason` — skip the hard check; leave a reason for humans.

There is no engine cascade. Child → parent freshness is `iInvalidateForeignKey` (mark parent dirty, **never fail the child write**) or `foreignKeyComputesMe` (eager recompute). Pick the XML edge; do not subscribe in product code.

## Indexes are query-shaped

SQL Server / Postgres: index the FKs, maybe a covering index, maybe a full-text catalog.

Mongo: **every list filter you care about should have an index declared in XML** (`<index>`, `<uniquekey>`, `<shard>`). A collection scan that “worked in SQL because the table was small” will not stay cheap.

Stencil-specific:

- `searchable="true"` fields concatenate into a lowercase `searchable` blob and a collated text index. That is not SQL `LIKE '%foo%'` on five columns, and **encrypted fields do not participate**.
- The full-entity `Projection` **omits `searchable`** so the blob does not leak on ordinary reads.
- `<uniquekey>` is uniqueness you actually want. Mongo will not infer it from “this feels like a PK.”
- `<index ttl="true">` expires documents by a date field (sessions, presign records). SQL leftover tables usually need a job; TTL is an index option.
- `<shard><entry kind="hashed">…` is placement, not a unique constraint.

`MongoIndexService` re-applies XML indexes on a schedule so new jurisdictions converge. You still **declare** them.

## Tenancy is not a `client_id` column you remember to filter

SQL multi-tenant patterns: a `ClientId` column, a schema per customer, or a database per customer — plus hope every query includes the predicate.

Stencil:

| `tenant=` | What it is |
|-----------|------------|
| `Isolated` | Document lives in that jurisdiction’s database; `jurisdiction_id` is on the document; admin routes include it |
| `Shared` | Global collection (Role, Timezone) |
| `Route` | The jurisdiction row itself |

The **connection** is chosen by the manager (`_findIsolated` vs `_findShared`). User `/v1/*` routes take jurisdiction from **the authenticated account**, not the JSON body. Filtering `WHERE client_id = @p` in a stored proc is not the same as “the driver opened a different cluster.”

## Transactions and atomicity

A SQL stored procedure can update five tables and roll back.

Mongo’s cheap atomic unit is **one document**. Stencil leans on that:

- Perspective update = one `$set` of that group.
- `calculateAndPersist` = one `$set` of calculated fields + `calculation_utc`.
- Multi-document work is sequenced in the manager (and sometimes marked dirty for later). Do not assume a failed step 3 rolled back step 1 unless the code made it so.

When you need “all or nothing” across collections, that is a design event — not the default.

## Types that surprise SQL people

- **`_id`** is the primary key. Often a UUID string in app code; Mongo may store BSON Binary. A plugin converts so you do not think in Binary in TypeScript.
- **`Uuid` vs `string` ids** — pick in XML; do not mix casually.
- **Arrays** (`Thing[]`, `LocalizedText[]`) are first-class. They are not child tables.
- **Enums** are numbers (or `enumString` unions) in the document, with generated pickers. They are not lookup tables unless you made an entity.
- **Queryable encryption** (`encrypted="true"`) is field-level CSFLE. You cannot treat that field as a normal index/search input.
- **Packed JSON** in a string column must be named `*_json` and `html="true"` so sanitizers do not corrupt it. Prefer a real nested class when the shape is stable.

## Mental test

Before you add a collection, ask:

1. Should this be an **embedded class** on a parent (no lifecycle of its own)?
2. Should this be an **id + snapshot projection** (list display)?
3. Should this be its **own Isolated/Shared entity** (own writes, own indexes, own permissions)?

If you reach for a join table out of habit, pause. Stencil will let you create one. That does not mean you should.
