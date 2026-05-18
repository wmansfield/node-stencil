# Code Generation System

**This is the most important file in the AI knowledge base.**

The codebase is largely generated from a single XML file. Understanding this system is essential for making changes correctly.

## Overview

```
stencil-entities.xml  --[XSL Templates]-->  Generated Code
                                                  |
                                            .base.ts files (regenerated)
                                            .ts files (ENSUREFILE - created once)
```

## Source Files

| Path | Purpose |
|------|---------|
| `server/generation/xml/stencil-entities.xml` | Entity, enum, and feature definitions |
| `server/generation/xsl/*.xsl` | XSL templates for code generation |
| `server/generation/tools/code-generator-cli.exe` | Generator executable |

## Running the Generator

```bash
cd server/generation/tools
./code-generator-cli.exe
# Config is read from code-generator.config.xml in the same folder
```

## Generated Output

### Backend (NestJS)
| Template | Output | Token |
|----------|--------|-------|
| `nest.model.xsl` | `{entity}.model.ts` | STARTFILE |
| `nest.schema.xsl` | `{entity}.schema.ts` | STARTFILE |
| `nest.module.xsl` | `{entity}.module.ts` | ENSUREFILE |
| `nest.manager.xsl` | `{entity}.manager.base.ts` | STARTFILE |
| `nest.manager.xsl` | `{entity}.manager.ts` | ENSUREFILE |
| `nest.controller.xsl` | `{entity}.controller.base.ts` | STARTFILE |
| `nest.controller.xsl` | `{entity}.controller.ts` | ENSUREFILE |

### Frontend (React)
| Template | Output | Token |
|----------|--------|-------|
| `react.model.xsl` | `stencil/models/entities/{entity}.ts` | STARTFILE |
| `react.api.xsl` | `stencil/endpoints/entities/{entity}Api.ts` | STARTFILE |
| `react.crud.xsl` | `views/super/crud/{entity}/{Entity}List.tsx` | ENSUREFILE |
| `react.crud.xsl` | `views/super/crud/{entity}/{Entity}Editor.tsx` | ENSUREFILE |
| `react.components.xsl` | `views/super/pickers/{Enum}Picker.tsx` | ENSUREFILE |

## File Generation Tokens

- **STARTFILE**: Creates/overwrites file every time generator runs
- **ENSUREFILE**: Creates file only if it doesn't exist (safe for customization)

---

## XML Schema Reference

### Root Element

```xml
<items projectName="Stencil"
       backendPrefix="backend\src\"
       frontendPrefix="frontend\src\"
       securityEntity="jurisdiction"
       securityRoute="jurisdiction_id">
```

### Entity Definition (`<item>`)

```xml
<item name="Widget"
      friendlyName="Widget"
      tenant="Isolated"
      useDocument="true"
      uiDisplayField="title"
      uiDetail="true"
      uiDefaultSort="created_utc">
```

| Attribute | Values | Description |
|-----------|--------|-------------|
| `name` | PascalCase | Entity name |
| `tenant` | `Shared`, `Isolated`, `Route` | Jurisdiction isolation pattern |
| `useDocument="true"` | boolean | Creates MongoDB collection |
| `classOnly="true"` | boolean | Embedded type only (no collection) |
| `uiDetail="true"` | boolean | Generates detail view |
| `uiDisplayField` | field name | Field shown in pickers |
| `uiDefaultSort` | field name | Default sort field in list views |
| `uiNestedComponent="true"` | boolean | Used in nested forms |

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
       friendlyName="Title">title</field>
```

| Attribute | Values | Description |
|-----------|--------|-------------|
| `type` | `string`, `int`, `boolean`, `Date`, `Uuid`, `EntityName`, `EnumName`, `EntityName[]` | Field type |
| `isNullable` | boolean | Can be null |
| `isClass="true"` | boolean | Type is another entity/class |
| `maxLength` | number or `"none"` | String max length |
| `searchable` | boolean | Include in text search |
| `sortable` | boolean | Allow sorting by this field |
| `filter` | boolean | Show as filter in UI |
| `uiList` | boolean | Show in list view |
| `uiHidden` | boolean | Hide from UI |
| `perspective` | string | Group for partial updates |
| `foreignKey` | entity name | Foreign key relationship |
| `foreignKeyField` | field name | Foreign key target field |
| `foreignKeyInvalidatesMe` | boolean | Recalculate when FK changes |
| `calculated` | `"self"`, `"other"` | Computed field |
| `recalculate` | boolean | Field triggers recalculation |
| `tenant` | boolean | This field is the tenant ID |

### Projection Definition

```xml
<projection name="Public" get="true">
  <entry>_id</entry>
  <entry>display_name</entry>
  <!-- Computed field only in projection -->
  <field type="string" friendlyName="Token">token</field>
</projection>
```

Creates `Entity.Public` type with only specified fields. `get="true"` generates a getter method.

### Index Definition

```xml
<index name="by_jurisdiction_created">
  <entry direction="Ascending">jurisdiction_id</entry>
  <entry direction="Ascending">created_utc</entry>
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
  <entry kind="hashed">jurisdiction_id</entry>
</shard>
```

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

---

## Feature Definition (User-Facing APIs)

Features define API endpoints for user-facing clients (web, mobile):

```xml
<feature name="auth" area="user" native="true">
  <!-- Request/response types -->
  <entity name="RegisterRequest">
    <field type="string">jurisdiction</field>
    <field type="string">auth_token</field>
    <field type="string">display_name</field>
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
            authJurisdiction="params.jurisdiction"
            request="params"
            requestType="RegisterRequest"
            itemResult="Account.Self" />
</feature>
```

| Element | Purpose |
|---------|---------|
| `<entity>` | Request/response type definition |
| `<query>` | GET endpoint |
| `<mutation>` | POST endpoint |

---

## Common Patterns

### Adding a New Entity

1. Add `<item>` to XML with fields
2. Run generator
3. Register module in `entity.module.ts` and `entity.registry.ts`
4. Customize `{entity}.manager.ts` for business logic

### Adding a New Enum

1. Add `<enum>` to XML
2. Run generator
3. Pickers are auto-generated

### Adding a Field to Existing Entity

1. Add `<field>` to the `<item>` in XML
2. Run generator
3. Update any custom code that needs the new field

### Adding a Projection

1. Add `<projection>` inside `<item>`
2. Run generator
3. Use `Entity.ProjectionName` type in code
