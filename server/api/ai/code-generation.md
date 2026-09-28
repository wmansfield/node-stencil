# Code Generation System

**This is the most important file in the AI knowledge base.**

The Stencil codebase is largely generated from a single XML file. Understanding this system is essential for making changes correctly.

## Overview

```
stencil-entities.xml  --[XSL Templates]-->  Generated Code
                                                  |
                                            files rewritten every run (.base.ts, models, admin screens)
                                            files created once (*.manager.ts, *.controller.ts)
```

This is **not** write-once scaffolding. Many platforms generate files you then own and never regenerate. Here, models, schemas, `*.base.ts`, validators, frontend models, API hooks, and admin screens are overwritten on every generator run. Kept logic lives in `*.manager.ts` and `*.controller.ts`, which are created if missing and then left alone. Edits in a rewritten file are lost; if that file is wrong, change XML or XSL.

The log is how you tell them apart: **Created/Updated** versus **Skipping existing file**. The XSL templates use splice markers (`STARTFILE`, `ENSUREFILE`, `ENDFILE`) so one template can emit many files. The CLI strips those markers. They never appear under `server/api`. Do not teach the marker names unless someone is editing XSL. The marker reference is `server/generation/tools/src/README.md`.

## Source Files

| Path | Purpose |
|------|---------|
| `server/generation/xml/stencil-entities.xml` | Entity, enum, and feature definitions |
| `server/generation/xsl/*.xsl` | XSL templates for code generation |
| `server/generation/tools/code-generator-cli.exe` (or `code-generator-cli` on macOS/Linux) | Generator CLI — AI entrypoint; build with `tools/src/build.ps1` or `src/build.sh` |

## Running the Generator

AI and automation use the **CLI**. Humans on Windows can also open the **GUI** to inspect templates and output.

`server/generation/tools/` holds only the binaries and `code-generator.config.xml`. Build scripts live in `src/`.

```bash
# from repo root — if the CLI is already built
./server/generation/tools/code-generator-cli          # macOS / Linux
.\server\generation\tools\code-generator-cli.exe      # Windows

# if the CLI is missing, build once then generate
./server/generation/tools/src/generate.sh             # macOS / Linux
.\server\generation\tools\src\generate.ps1            # Windows
```

No extra arguments are required. The CLI reads `code-generator.config.xml` in the same folder (XML source, templates, output).

Windows GUI (human walkthrough only): `server/generation/tools/code-generator.exe` after a Windows build (`tools/src/build.ps1`). It is not produced on macOS/Linux.

This repository has no native app. Feature clients are TypeScript, generated for the React admin frontend. Do not look for `app/src/`.

## Generated Output

### Backend (NestJS)
| Template | Output | Next run |
|----------|--------|----------|
| `nest.model.xsl` | `{entity}.model.ts` | Rewritten |
| `nest.schema.xsl` | `{entity}.schema.ts` | Rewritten |
| `nest.module.xsl` | `{entity}.module.ts` | Rewritten |
| `nest.manager.xsl` | `{entity}.manager.base.ts` | Rewritten |
| `nest.manager.xsl` | `{entity}.manager.ts` | Created once, then skipped |
| `nest.manager.xsl` | `account-deletion-manager.ts` | Rewritten |
| `nest.dependency.xsl` | `entities/dependencies/dependency-coordinator.ts` | Rewritten |
| `nest.controller.xsl` | `{entity}.controller.base.ts` | Rewritten |
| `nest.controller.xsl` | `{entity}.controller.ts` | Created once, then skipped |
| `nest.module.xsl` | `entity.module.ts`, `entity.registry.ts` | Rewritten |
| `nest.mcp.xsl` | `features/mcp.schemas.ts`, `features/mcp.registry.ts` | Rewritten |
| `nest.mcp.xsl` | `features/{area}/{feature}/{feature}.operations.ts`, `{feature}.mcp.base.ts` | Rewritten |

### Frontend (React)
| Template | Output | Next run |
|----------|--------|----------|
| `react.model.xsl` | `stencil/models/entities/{entity}.ts` (+ feature models under `stencil/models/features/**`) | Rewritten |
| `react.api.xsl` | `stencil/endpoints/entities/{entity}Api.ts` **and** `stencil/endpoints/features/{area}/{feature}Api.ts` | Rewritten |
| `react.crud.xsl` | `views/super/crud/{entity}/{Entity}List.tsx` and `{Entity}Editor.tsx` | Rewritten |
| `react.components.xsl` | `views/super/pickers/{Enum}Picker.tsx` | Rewritten |

## Never hand-edit a rewritten file

Do not edit these directly. Change XML or XSL, run the generator, then customize `*.manager.ts` / `*.controller.ts`:

- Backend `*.model.ts`, `*.schema.ts`, `*.manager.base.ts`, `*.controller.base.ts`
- Backend `*.sanitized.validators.ts`, `list-input-*.ts`
- Backend generated aggregators: `entity.module.ts`, `entity.registry.ts`, `account-deletion-manager.ts`
- Backend MCP output: `features/mcp.schemas.ts`, `features/mcp.registry.ts`, `features/**/*.operations.ts`, `features/**/*.mcp.base.ts`
- Generated `entities/dependencies/dependency-coordinator.ts`
- Generated frontend/app entity models and API stubs
- Generated feature FE clients: `frontend/src/stencil/endpoints/features/**/*Api.ts` and `frontend/src/stencil/models/features/**`

`*.manager.ts` and `*.controller.ts` are the customization points. Admin list, editor, and picker screens in this repo are rewritten with the schema.

### Feature APIs (FE) — rewritten every run

`<feature>` XML drives FE RTK Query clients. **Never hand-maintain feature `*Api.ts` files** — change XML and regenerate.

- **Reads** that POST a JSON body: use `<query name="…" route="…" post="true" … />` so codegen emits `build.query` / `useXQuery` (caching, `providesTags`).
- **Writes / tasks**: use `<mutation … />` → `build.mutation` / `useXMutation`.
- Prefer unique method names (`listCustomers`, `listFamilies`) so hooks don't collide across features.
- `@invalidation="tag"` wires RTK tags. Backend feature controllers stay hand-written.

Details: `ai/patterns/features-api.md`.

---

## XML Schema Reference

This table is the generator contract, **not a catalog of what this clone currently uses**. If an attribute is listed here, XSL already emits the behavior. Set it on the XML and regenerate. Do not hand-write an equivalent getter, list filter, invalidation cascade, RTK hook, or admin widget because this clone’s `stencil-entities.xml` has no example yet.

### Root Element

```xml
<items projectName="Stencil"
       backendPrefix="backend\src\" 
       frontendPrefix="frontend\src\" 
       securityEntity="jurisdiction" 
       securityRoute="jurisdiction_id"
       mongooseVersion="8">
```

| Attribute | Values | Description |
|-----------|--------|-------------|
| `projectName` | PascalCase | Product name used in generated imports and namespaces |
| `backendPrefix` | path | Output prefix for Nest files (relative to generator output folder) |
| `frontendPrefix` | path | Output prefix for React files |
| `securityEntity` | entity name | Tenant entity (usually `jurisdiction`) |
| `securityRoute` | field name | Tenant route/field name (usually `jurisdiction_id`) |
| `mongooseVersion` | number | `>= 9` drops `extends Document` on schema classes |
| `isolatedGetByIdUsesWorkspaceFilter` | boolean | Isolated `getById` / `validateExistence` AND the extra non-isolated tenant field into the filter (workspace-style lookup) |

### Entity Definition (`<item>`)

```xml
<item name="Account" 
      friendlyName="Account" 
      tenant="Isolated" 
      useDocument="true" 
      uiDisplayField="display_name"
      uiDetail="true"
      uiDefaultSort="created_utc">
```

| Attribute | Values | Description |
|-----------|--------|-------------|
| `name` | PascalCase | Entity name |
| `friendlyName` | string | Human label |
| `tenant` | `Shared`, `Isolated`, `Route` | Jurisdiction isolation pattern |
| `useDocument="true"` | boolean | Creates MongoDB collection |
| `classOnly="true"` | boolean | Embedded type only (no collection) |
| `uiDetail="true"` | boolean | Generates detail view |
| `uiDisplayField` | field name | Field shown in pickers |
| `uiDefaultSort` | field name | Default sort field in list views |
| `uiDefaultSortDesc="true"` | boolean | Default list sort is descending |
| `uiNestedComponent="true"` | boolean | Used in nested forms |
| `uiGenerate="false"` | boolean | Skip all UI scaffold (list/editor/picker/model). Default is on. |
| `uiName` | string | Override the generated UI type/component name |
| `uiListCards="true"` | boolean | Card-style list instead of the default table |
| `noCreateApi="true"` | boolean | Omit generated create REST/RTK mutation |
| `noReplaceApi="true"` | boolean | Omit generated replace REST/RTK mutation |
| `customDelete="true"` | boolean | Do not emit generated `delete()` — implement on the manager extension |
| `obsolete` | string | Marks the entity obsolete; comment text is emitted on the model |
| `accountDeletion` | see [Account erasure](#account-erasure-dsar) | How this collection participates in physical account erasure |
| `accountDeletionPhase` | string | Grouping label for the erasure walker (not a closed enum) |
| `accountDeletionOrder` | number | Order within the generated plan (lower runs first) |
| `deletionHandler` | method name | Method on `*.manager.ts` for `accountDeletion="custom"` (receives `auth_identifier`) |
| `releaseHandler` | method name | Method on `*.manager.ts` for `accountDeletion="released"` |
| `retainReason` | string | Why `retained` rows are kept; generator does not emit code from it |

> **Rule — UI entities require a searchable field.** Any `<item>` that generates UI (i.e. `uiGenerate` is not `false`) **must** have at least one field marked `searchable="true"`. If it doesn't, the generator emits a literal `code-gen-error:` line into `{entity}.manager.base.ts` instead of valid code (and, since that file is rewritten every run, the error returns until fixed). The searchable fields back the generated list-view search box, a concatenated lowercased `searchable` blob, and the `default_searchable_en_v1` text index. To fix: either mark a sensible field `searchable="true"`, or set `uiGenerate="false"` on entities that genuinely need no UI (e.g. pure join/memo tables). Note: `encrypted` fields are excluded from the searchable blob, so don't rely on them to satisfy this rule.

> **Reusing an enum type across two fields is supported.** An `<item>` may declare two (or more) fields of the same enum type. The generator deduplicates the enum `import` by *type* (Muenchian grouping, array-stripped so `Foo` and `Foo[]` collapse). Filter-only loops use a `@filter='true'` variant of the key so a non-filter field of the same type cannot shadow a filter field.

### Field Definition (`<field>`)

```xml
<field type="string" 
       isNullable="true" 
       maxLength="150" 
       searchable="true" 
       sortable="true" 
       uiList="true"
       filter="true"
       perspective="Info"
       foreignKey="Asset"
       foreignKeyField="_id"
       validate="email"
       friendlyName="Display Name">display_name</field>
```

| Attribute | Values | Description |
|-----------|--------|-------------|
| `type` | `string`, `int`, `boolean`, `Date`, `Uuid`, `EntityName`, `EnumName`, `EntityName[]` | Field type |
| `isNullable` | boolean | Can be null |
| `isEnum="true"` | boolean | Type is an enum |
| `isClass="true"` | boolean | Type is another entity/class |
| `maxLength` | number or `"none"` | String max length |
| `minLength` | number | String min length (generated validate) |
| `minValue` / `maxValue` | number or `"none"` | Numeric bounds (generated validate) |
| `searchable` | boolean | Include in text search |
| `sortable` | boolean | Allow sorting by this field |
| `filter` | boolean | Show as filter in UI |
| `nestedFilter="true"` | boolean | Expand nested-class fields into list-filter params |
| `uiList` | boolean | Show in list view |
| `uiHidden` | boolean | Hide from UI |
| `uiReadOnly="true"` | boolean | Editor control is read-only (still stored) |
| `uiOrder` | number | Editor/list field order |
| `uiParent` | boolean | FK is this entity's UI parent (see below) |
| `uiPickerRoute="true"` | boolean | Extra picker prop passed through as a list-route filter |
| `uiPickerFilter="true"` | boolean | Extra picker prop that toggles an equality filter (`{field}Only`) |
| `uiTriState="true"` | boolean | Boolean editor is a tri-state (true / false / unset) |
| `uiUploadAsset` | string | Admin upload widget scoped to this asset store (e.g. `Jurisdiction`) |
| `uiUploadAvatar` | string | Avatar upload; also pulls `StorageModule` into the entity Nest module |
| `uiFacadeType` | type name | FE model uses this facade type instead of the XML `type` |
| `perspective` | string | Group for partial updates (see rule below) |
| `foreignKey` | entity name | Foreign key relationship |
| `foreignKeyField` | field name | Foreign key target field |
| `foreignKeyComputesMe` | boolean | Child write → sync parent `calculateAndPersist` (eager) |
| `iInvalidateForeignKey` | boolean | Child write → mark FK parent dirty (`calculation_utc = null`); never fails the child write. Generates `DependencyCoordinator.on{Child}Changed`. |
| `foreignKeyInvalidatesMe` | boolean | Parent write → mark dependents that reference it dirty (snapshot freshness) |
| `foreignKeyInvalidationCascadesToMe` | boolean | Participate in a longer invalidation cascade |
| `fakeForeignKey="true"` | boolean | Treat as an FK in types/UI but skip existence checks and delete-reference blocking |
| `detachedForeign="true"` | boolean | FK target is not in this tenant — do not pass tenant fields into `validateExistence` / invalidate |
| `softForeignReason` | string | Skip hard FK existence check; reason is for humans/AI |
| `noGet="true"` | boolean | Do not add this FK as a generated list-filter argument |
| `calculated` | `"self"`, `"other"` | Computed field; non-nullable scalars get ctor type defaults (0 / `''` / first enum) before `Object.assign` |
| `recalculate` | boolean | Field triggers recalculation |
| `validate` | `"email"` | Built-in validation rule |
| `extraValidation` | method name | Call this manager method during insert/replace/perspective validate |
| `encrypted` | boolean | MongoDB Queryable Encryption on this field |
| `encryption` | string | Non-empty → emit `prepareEncryptionFields(document)` on insert/replace |
| `html` | boolean | Allow HTML / skip prose sanitizer (required for `_json` packed columns) |
| `readOnly` | boolean | Cannot be modified after creation |
| `truncateLog` | boolean | Truncate in logs |
| `idAlias` | boolean | Parallel id field (prefer `[entity]_id`); generator copies `_id` onto it. Route tenant URLs use this name |
| `accountOwner="true"` | boolean | This field is the account id used by generated `deleteAllForAccount` (`owned`) |
| `accountSubject="true"` | boolean | Annotation: this field names a person in the document; erasure code is still yours on `*.manager.ts` |
| `accountEmbedded="true"` | boolean | Annotation: nested class holds account-owned members; generator does not scrub it |
| `tenant` | boolean | This field is the tenant ID |
| `isolated="true"` | boolean | On a `tenant="true"` field: omit it from generated tenant method params (connection already isolates) |
| `getForSingle` | boolean | Generate a single-entity getter keyed on this field (see rule below) |
| `getFor="true"` | boolean | Generate `getFor{FriendlyName}(...): Promise<Entity[]>` — find-many by this field (not the single getter) |
| `enumString` | enum name | Store/type as string union of enum member names rather than numeric enum |
| `forceLower` / `forceUpper` | boolean | Normalize string case on assign |
| `searchToggle` | default value | Extra list-search boolean/enum param with this default |
| `extraImport` | type name | Extra generated import for this field's type |
| `sdkHidden="true"` | boolean | Exclude from generated SDK sort/search allow-lists |
| `obsolete` | string | JSDoc obsolete note on the generated field |
| `hackUIDuplicate="true"` | boolean | Exclude this field from the standard-type grouping key (legacy UI duplicate workaround — prefer not to add new uses) |
| `multiLine` | boolean | Multi-line text editor |
| `isAvatar` | boolean | Avatar-related field metadata for UI |

> **Rule — updates go through perspectives; `replace` is exception-only.** Grouping fields with `perspective="Name"` generates `Entity.NamePerspective` (a write-through view over the actual), `entity.asNamePerspective()`, and `manager.updateNamePerspective(perspective)` — a targeted `$set`/`$unset` of exactly those fields, with its own sanitize/validate/pre/post hooks. **All updates in custom code (feature controllers, services, tasks, manager extensions) must use perspective updates** — one perspective, or several in sequence if the write spans groups. Do not call `manager.replace(...)` from custom code: a full-document replace silently clobbers concurrent writers of other field groups, hides write intent from the schema, and bypasses per-group hooks. If the field you need to update isn't in any perspective, add `perspective="..."` in the XML and regenerate — don't fall back to `replace`. Two sanctioned exceptions: (1) the generated CRUD `*.controller.base.ts` endpoints keep `replace` *for now* — they are effectively raw DB-access endpoints; (2) a custom call site may use `replace` only with an explicit, approved reason documented in a comment at the call site.
>
> Mutation flow note: `insert` and `replace` still fire each perspective's pre/post mutation hooks (with `DocumentOperation.insert` / `.replace`), so perspective hooks see every path that touches their fields.

> **`uiParent="true"` — UI nesting.** Marking a foreign-key field as `uiParent` makes the FK target this entity's parent in the generated admin UI: the parent's detail page (requires `uiDetail="true"` on the parent) embeds this entity's list scoped by the FK, the child's editor receives the parent id as a prop (the field is removed from the form), breadcrumbs chain to the parent, and the entity is excluded from top-level navigation. The tenant field (`jurisdiction_id`) is always one `uiParent`; add **at most one more** non-tenant `uiParent` per entity — the editor requires every `uiParent` value as context, so a child with two non-tenant parents cannot be created from either parent's page. A nullable `uiParent` FK generates an optional editor prop, allowing the child to exist unattached.

> **`getForSingle="true"` — generated single-entity getter.** Marking a field with this generates a manager method `getFor<FriendlyName>(<tenant fields>, <field>): Promise<Entity | undefined>` on the entity's `*.manager.base.ts`, backed by `_findOne<Tenant>` (returns the first match, not a list). Use it instead of hand-writing a "find by X" lookup on the custom `*.manager.ts`. The method name comes from the field's `friendlyName` with spaces removed (e.g. `friendlyName="Auth Identifier"` → `getForAuthIdentifier`), and tenant fields are prepended to the signature automatically. It pairs naturally with a `<uniquekey>` on the same field: the unique key makes "one row per value" true, and the getter reads that one row — so a single-value lookup should be this attribute plus a `<uniquekey>`, not a bespoke manager method. `getForSingle` does not itself create an index; add the `<uniquekey>` (or an `<index>`) for the lookup path.

### Projection Definition

```xml
<projection name="Public" get="true">
  <entry>_id</entry>
  <entry>display_name</entry>
  <entry>handle</entry>
  <!-- Computed field only in projection -->
  <field type="string" friendlyName="Token">token</field>
</projection>
```

Creates `Entity.Public` type with only specified fields. `get="true"` generates a getter method. `update="true"` generates an update helper unless `manualUpdate="true"` (you implement the write yourself). `search="true"` / `default="true"` generate specialized `find{Name}` list methods.

Optional sibling of fields: `<perspective name="Info" sdkUpdate="true" />` — emits an RTK mutation for that perspective on the FE SDK. Field `perspective="Info"` still defines the write-through view; this element opts the SDK into calling it.

### Index Definition

```xml
<index name="by_owner">
  <entry direction="Ascending">owner_account_id</entry>
  <entry direction="Descending">created_utc</entry>
</index>

<uniquekey name="unique_pair">
  <entry direction="Ascending">account_id</entry>
  <entry direction="Ascending">key_id</entry>
</uniquekey>

<!-- TTL index for auto-deletion -->
<index name="purge_utc" ttl="true">
  <entry direction="Ascending">purge_utc</entry>
</index>
```

### Shard Definition

```xml
<shard>
  <entry kind="hashed">account_id</entry>
</shard>
```

| Attribute | On | Description |
|-----------|----|-------------|
| `name` | `<index>`, `<uniquekey>` | Index name |
| `ttl="true"` | `<index>` | TTL index (auto-delete by the indexed date field) |
| `direction` | `<entry>` | `Ascending` / `Descending` |
| `kind` | `<shard>/<entry>` | e.g. `hashed` |
| `ignoreBlanks="true"` | `<entry>` | Partial unique index: ignore documents where this entry is blank |

### Enum Definition

```xml
<enum name="AccountStatus">
  <field value="0" friendlyName="Enabled">enabled</field>
  <field value="1" friendlyName="Disabled">disabled</field>
</enum>
```

Generates:
- Backend: Enum type in `entities/enums/`
- Frontend: Enum type in `stencil/models/entities/`
- Pickers: `AccountStatusPicker.tsx`, `AccountStatusPickerMulti.tsx`

Enum `<field>` attributes: `value` (numeric), `friendlyName` (label), `sort` (picker order). `uiGenerate="false"` on `<enum>` skips pickers.

---

## Feature Definition

A `<feature>` is an HTTP contract for a TypeScript client. In this repository that client is the React admin frontend. A checkout with a native app can emit a second client from the same XML; this one does not.

```xml
<feature name="auth" area="user" native="true">
  <!-- Request/response types -->
  <entity name="RegisterRequest">
    <field type="string">jurisdiction</field>
    <field type="string">auth_token</field>
  </entity>
  
  <!-- GET endpoint -->
  <query name="getSelf" 
         route="v1/auth/self" 
         authToken="auth_token" 
         request="auth_token" 
         requestType="string" 
         itemResult="Account.Self" />
  
  <!-- POST endpoint -->
  <mutation name="register" 
            route="v1/auth/register" 
            post="true"
            authToken="params.auth_token" 
            request="params" 
            requestType="RegisterRequest" 
            itemResult="Account.Self" />
</feature>
```

| Element / Attribute | Purpose |
|---------------------|---------|
| `<entity>` | Request/response type definition |
| `<query>` | Read endpoint (GET unless `post="true"`) |
| `<mutation>` | Write / side-effect endpoint (POST) |
| `name` | Method / hook name — keep unique across features |
| `area` | Feature area folder (`user`, `admin`, …) |
| `route` | HTTP path |
| `post="true"` | Send a JSON body (use on `<query>` when the read is a POST) |
| `put="true"` | Use PUT instead of POST |
| `request` / `requestType` | Parameter name and TypeScript type |
| `requestRouted="true"` | Wrap the request in `RoutedInput<T>` (`jurisdiction_id` + `input`) |
| `itemResult` / `listResult` | Single or list result type |
| `entity` | Entity type for a list result when not using `itemResult` |
| `authToken` | Where the auth token is read from |
| `authJurisdiction` | Where jurisdiction is read from for the signed call |
| `invalidation` | RTK tag name (`providesTags` on queries, `invalidatesTags` on mutations) |

Feature entity `<field>` elements also take `friendlyName` and `description`. They become the JSON Schema `title` and `description` of MCP tool arguments, which is what a model reads to fill them in.

### MCP tools (`<mcp>`)

A `<query>` or `<mutation>` becomes an MCP tool only when it carries an `<mcp>` child. Without one, the operation is not reachable over MCP. Which callers may use a tool is decided by the MCP gateway in front of this API, not here.

```xml
<mutation name="nameUpdate" route="v1/profile/name" request="params" requestType="NameRequest" itemResult="Account.Self">
  <mcp tool="profile_update_display_name" title="Update display name" destructive="false" idempotent="true">
    <description>Set the signed-in user's display name. Returns the updated profile.</description>
  </mcp>
</mutation>
```

| Attribute / child | Purpose |
|-------------------|---------|
| `tool` | Tool name: 1-64 characters of `[a-z0-9_]`, unique across the schema. Treat it as a public contract once published |
| `title` | Short human label (required) |
| `<description>` | What the tool does and returns, written for the model choosing it (required) |
| `destructive`, `idempotent` | Required on `<mutation>`. Queries default to read-only and idempotent |
| `readOnly`, `openWorld` | Optional hint overrides (`openWorld` defaults to `false`) |

The generator writes a `code-gen-error:` line (so the build fails) when a tool name is invalid or duplicated, `title` or `<description>` is missing, a mutation omits `destructive`/`idempotent`, the feature is not `area="user"`, the operation is `requestRouted`, `requestType` is not a request `<entity>` of the feature, or the result is a full document. Results must be a projection, a class-only type, or a feature entity.

Generated per feature: `{feature}.operations.ts` (the `I{Feature}Operations` contract, one member per MCP-enabled operation) and `{feature}.mcp.base.ts` (tool definitions with input/output JSON Schemas). `features/mcp.registry.ts` binds each feature's tools to its hand-written `{Feature}Controller` (in `{feature}.controller.ts`), which declares `implements I{Feature}Operations`.

There is no service layer: MCP calls the controller method directly, the same method HTTP routes to.

- **Method names** match the XML operation names (`nameUpdate`, not `name`).
- **Signature** is `(request: FeatureRequest, input: I{Request})`. `FeatureRequest` carries only `auth.payload` and `account`, which is what `AuthGuard` leaves on an HTTP request and what MCP builds from the verified gateway identity.
- **Compiler checks:** the contract uses property form, so a method still typed `StencilRequest` fails the build (TS2416), as does an operation added to the XML without a controller method. If an operation needs the raw HTTP request, move the shared logic into a private method both paths call; an operation that cannot do that is not an MCP candidate.
- **Guards:** `AuthGuard`/`RateLimitGuard`/`Sanitize.for` apply on HTTP. MCP applies the equivalent checks itself (verified identity, live account, regional home, per-tool rate limit, request-model validation) before calling the method.

Pattern details: `ai/patterns/mcp.md`.

JSON-packed string columns: suffix `_json` and set `html="true"` (see `.cursor/rules/json-packed-fields.mdc`). Schema comments describe the element's own purpose, not a downstream consumer (`.cursor/rules/schema-comment-scope.mdc`).

---

## Common Patterns

### Adding a New Entity

1. Add `<item>` to XML with fields
2. Run generator
3. Confirm regenerated `entity.module.ts`, `entity.registry.ts`, and `account-deletion-manager.ts` include the entity when applicable
4. Customize `{entity}.manager.ts` for business logic

### Adding a New Enum

1. Add `<enum>` to XML
2. Run generator
3. Pickers are auto-generated

### Adding a Field to Existing Entity

1. Add `<field>` to the `<item>` in XML — **nullable** unless every existing document already has a value
2. Run generator
3. Update any custom code that needs the new field

Required backfills and type rewrites are data migrations: add a `JurisdictionSchemaVersion` and a step in `JurisdictionSchemaService` (`backend/src/tasks/jurisdiction-schema/`). Do not make old rows invalid from XML alone.

### System timestamps vs domain dates

The generator owns `created_utc` and `updated_utc` on every document (do not declare them in XML). `deleted_utc` is the platform tombstone (declare in XML for sync/federated entities; do not use it as a domain “when this happened” field). Domain dates use names like `generated_utc`, `authored_utc`, `published_utc`.

### Account erasure (DSAR)

Tombstones (`deleted_utc`) are the normal delete. Physical `deleteMany` is only the account-erasure path. Every collection entity declares `accountDeletion` so the plan is schema-owned — do not keep a handwritten list of managers.

| `accountDeletion` | Meaning |
|-------------------|---------|
| `owned` | One owner field (`accountOwner="true"`). Generates `deleteAllForAccount` on the manager base and `IAccountDeletionManager`. |
| `none` | Catalog / reference data. Not in the generated plan. |
| `retained` | Keep the row. Put why in `retainReason` (review annotation; no codegen). |
| `custom` | Filter is not a single owner field. `deletionHandler` is a method on `*.manager.ts` that takes `auth_identifier` (shared auth mapping). |
| `released` | Unlink / recycle an identifier. `releaseHandler(account_id)` on `*.manager.ts`. |
| `paired` | Dual-homed: local physical delete plus a generated `deleteRemote{Entity}ForAccount` hook for the remote jurisdiction. |
| `hosted` / `referenced` / `embedded` | Not a simple owner filter (comments you authored, invites you appear on, nested member arrays). **Do not generate a naïve owner delete.** Implement `deleteAllForAccount` on `*.manager.ts`. Give `accountDeletionPhase` so the row is still in the plan. |

`accountDeletionPhase` is a **string label** (this clone uses `storage` then `account`). It is not a closed product enum. `accountDeletionOrder` is global: lower runs first. Account rows should be last among owned data; object storage should run before asset documents if the manager override deletes blobs.

Generated `entities/account-deletion-manager.ts` (rewritten every run) holds the registry. `AccountDeletionService.eraseAccount` walks it. Confirmation emails, export zips, and request-queue entities are product — they call `eraseAccount`; they are not generated.

Silence is the bug: if you add a collection and omit `accountDeletion`, erasure will not know about it.

Sample — owned widget later, catalog today:

```xml
<item name="Widget" tenant="Isolated" useDocument="true" accountDeletion="none">
   <!-- add account_id + accountOwner + phase when widgets become account-owned -->
</item>
<item name="Note" tenant="Isolated" useDocument="true"
      accountDeletion="owned" accountDeletionPhase="content" accountDeletionOrder="10">
   <field type="Uuid" accountOwner="true">account_id</field>
</item>
```

Details: [`patterns/account-deletion.md`](./patterns/account-deletion.md).

### Strict types

Fields are primitives, enums, `classOnly` nested classes, or FK ids. Do not pack JSON, use generic objects, or overload one field as two types. Opaque `*_json` + `html="true"` is last resort (see `.cursor/rules/json-packed-fields.mdc`).

### Entity-specific field names

Generic labels (`name`, a bare extra `id`) become ambiguous when two projections sit on one object. Prefer `[entity]_name` (or a unique domain word) and an `idAlias` of `[entity]_id` next to `_id`. Foreign keys should use that noun (`widget_id`). Details: `.cursor/rules/schema-field-names.mdc`.

### Adding a Projection

1. Add `<projection>` inside `<item>`
2. Run generator
3. Use `Entity.ProjectionName` type in code

### Calculated Fields & Computed References

Use `calculated="self"` / `calculated="other"`, `recalculate="true"`, and the
`applyCalculations` manager hook to add computed fields — including a **computed
reference** (a projection of a foreign entity stored inline so the UI gets clear,
searchable data instead of a bare FK id, e.g. `Target.customer: Customer.Reference`).

See `ai/patterns/calculated-fields-and-references.md` for the full pattern.
