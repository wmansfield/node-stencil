# Stencil overview

What Stencil *is*, in conceptual terms: [Introducing Stencil](./README.md). This page is the working vocabulary.

Stencil’s description of entities lives in one XML file. A generator writes NestJS and React admin boilerplate. Business rules go in **small extension files**.

```
stencil-entities.xml  →  generator  →  base files (rewritten every run)
                                      extension files (yours; kept)
```

Boilerplate is not the craft. The craft is the schema and the hooks.

## Facts that change how the work goes

1. **The XML is the source of truth.** Fields, indexes, enums, API shapes, tenant isolation, admin screens. If it is not in XML, it will drift.
2. **Some files are rewritten every run. Some are created once.** This is not a scaffold you then own (T4, yeoman, “generate and edit the output”). The generator log is the label, because nothing inside the file says which kind it is. **Created/Updated** means the next run will replace it: models, schemas, `*.manager.base.ts`, validators, frontend models and API hooks, admin list/editor. **Skipping existing file** means it is yours: `widget.manager.ts` and `widget.controller.ts`. Never patch a file the log rewrites. Change the XML, regenerate, then customize the extension.
3. **Talk to the AI before authoring.** Ask it to explain the entity, the manager hooks, the feature route. Writing code before the hook has a name is how a second, unofficial system appears.
4. **Managers are the only place documents change.** Controllers, jobs, and other services call `widgetManager.insert` / `updateInfoPerspective`. They do not open Mongo and `$set`. This is non-negotiable. See [enterprise-features](../../server/api/ai/enterprise-features.md).
5. **Jurisdiction is not a form field.** For user APIs, tenant comes from `request.account.jurisdiction_id`. If you “just pass jurisdiction in the body,” you have a security bug.
6. **Projections and perspectives are named shapes.** A projection is a read mask (`Account.Public` is a type and a Mongo `.select()`). A perspective is a partial write (`updateInfoPerspective` sets only that group). Full explanation: [Perspectives and projections](./perspectives-and-projections.md).
7. **Deletes are usually tombstones.** Set `deleted_utc` (and bump `edited_utc`) so sync and federation still see the row. Physical `delete()` is for GDPR-style erasure, not “the user clicked remove.” That erasure path is schema-owned (`accountDeletion` on each collection, generated registry, `eraseAccount`). `deleted_utc` is a platform field, not a domain “when this was authored” date — those use names like `authored_utc` / `generated_utc`.
8. **Schema stays backward compatible when possible.** New fields are nullable so old documents still load. Rewriting stored data uses `JurisdictionSchemaService` (per-jurisdiction version), not a required XML cutover.
9. **Field names stay specific.** A tiny entity is still `widget_name` / `widget_id`, not `name` / extra generic `id`, so combined projections do not collide.

## How a change actually happens

Example: add a `subtitle` field to Widget, show it in the admin list, allow search.

1. Edit `server/generation/xml/stencil-entities.xml` — add a `<field>` with `searchable`, `uiList`, `perspective`.
2. Run `server/generation/tools/code-generator-cli.exe` (or `tools/src/generate.ps1` if the exe is missing).
3. Confirm the field appeared on the model, schema, and admin form. Those files are rewritten, so the new field shows up there without a hand edit.
4. If business rules apply (normalize, reject empty, recompute a snapshot), put them in `widget.manager.ts` hooks — `sanitize`, `validate`, `applyCalculations` — not in the HTTP controller.

If you are not sure which file to touch, **ask**. “Is this XML, a manager hook, or a feature controller?” is the right first question.

## Words and what they mean

| Word | Plain meaning |
|------|----------------|
| Entity / `<item>` | A thing we store (Account, Widget, Role). |
| Tenant Isolated / Shared / Route | Isolated = per jurisdiction database. Shared = global (roles, timezones). Route = the jurisdiction record itself. |
| Perspective | A named **write** group. `updateInfoPerspective` `$set`s only those fields. See [Perspectives and projections](./perspectives-and-projections.md). |
| Projection | A named **read** mask (`Account.Public`): a TypeScript type and the Mongo `.select()` list. |
| Feature | A product API (`/v1/...`), not the admin CRUD. Frontend hooks are generated; the backend controller is written by hand. |
| Calculated field | Stored derived data (a display snapshot, a normalized email). Filled by `applyCalculations`. |
| Sanitize | Strip/validate the HTTP body so clients cannot set system fields. |
| Dual-homed | A row that exists in more than one place (local + remote account ids). Queries must include the local id. |
| Federation | Regions talking to each other over signed HTTPS. Optional; local dev can be one process. |
| Memory cache | Short-lived `Map` inside one Node process for hot reads (roles, settings, account lookup). A write does not clear it. See [Memory cache](./memory-cache.md). |
| Localized content | Default language lives in the ordinary field (`title`, `description`). Other languages live in `*_localized`. A feature read copies the requested language onto that field. Admin CRUD returns both as stored. See [Localized content](./localized-content.md). |

## What the AI is for

Good uses:

- “Add this field to the XML and regenerate.”
- “Implement `applyCalculations` so Widget stores a `Thing.Reference`.”
- “Why did this list omit jurisdiction?”
- “Is there already an XML attribute for a single-row lookup?” (`getForSingle` — use it; do not hand-write `findByX`.)

Bad uses:

- Hand-editing `*.manager.base.ts`.
- Inventing a second table/collection “just for this report.”
- Copying a jurisdiction id from the request body on a user route.
- Logging a full Firebase uid / `auth_identifier`.

If an XML attribute already does the job, **use the attribute**. Absence of an example in this clone’s XML does not mean the generator cannot do it. The catalog is [`code-generation.md`](../../server/api/ai/code-generation.md).

## Mongo, briefly

If SQL is the familiar model, [Mongo is not SQL](./mongo-is-not-sql.md) covers the mismatch. Short version: a document can nest objects and arrays; there is no join planner as the default tool; foreign keys are checked by managers, not the database; snapshots (projections) sit next to ids so lists stay fast.

## Tracing an entity

`Widget` is a complete Isolated example:

1. `server/generation/xml/stencil-entities.xml` — the `<item>`.
2. `server/api/backend/src/entities/widget/` — `widget.manager.base.ts` is rewritten every run; `widget.manager.ts` is created once and then left alone.
3. Ask: “Walk through Widget from XML to manager to admin list. Which of these files would the next generator run replace?”
4. A small change (field, filter, validation) goes through the generator, not a patched base file.
