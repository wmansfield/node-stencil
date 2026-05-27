# Code Generation System

**This is the most important file in the AI knowledge base.**

The Stencil codebase is largely generated from a single XML file. Understanding this system is essential for making changes correctly.

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
```

The CLI reads `code-generator.config.xml`, which points at `../xml/stencil-entities.xml`.

Or use the GUI: `./code-generator.exe`

## Generated Output

### Backend (NestJS)
| Template | Output | Token |
|----------|--------|-------|
| `nest.model.xsl` | `{entity}.model.ts` | STARTFILE |
| `nest.schema.xsl` | `{entity}.schema.ts` | STARTFILE |
| `nest.module.xsl` | `{entity}.module.ts` | STARTFILE |
| `nest.manager.xsl` | `{entity}.manager.base.ts` | STARTFILE |
| `nest.manager.xsl` | `{entity}.manager.ts` | ENSUREFILE |
| `nest.controller.xsl` | `{entity}.controller.base.ts` | STARTFILE |
| `nest.controller.xsl` | `{entity}.controller.ts` | ENSUREFILE |
| `nest.module.xsl` | `entity.module.ts`, `entity.registry.ts`, `account-deletion-manager.ts` | STARTFILE |

### Frontend (React)
| Template | Output | Token |
|----------|--------|-------|
| `react.model.xsl` | `stencil/models/entities/{entity}.ts` | STARTFILE |
| `react.api.xsl` | `stencil/endpoints/entities/{entity}Api.ts` | STARTFILE |
| `react.crud.xsl` | `views/super/crud/{entity}/{Entity}List.tsx` | ENSUREFILE |
| `react.crud.xsl` | `views/super/crud/{entity}/{Entity}Editor.tsx` | ENSUREFILE |
| `react.components.xsl` | `views/super/pickers/{Enum}Picker.tsx` | ENSUREFILE |

### Mobile (React Native)
| Template | Output |
|----------|--------|
| `react.native.model.xsl` | `app/src/cloud/models/entities/{entity}.ts` |
| `react.native.api.xsl` | `app/src/cloud/api/{feature}Api.ts` |

## File Generation Tokens

- **STARTFILE**: Creates/overwrites file every time generator runs
- **ENSUREFILE**: Creates file only if it doesn't exist (safe for customization)

## Never Hand-Edit STARTFILE Output

Do not edit these directly. Change XML or XSL, run the generator, then customize extension files:

- Backend `*.model.ts`, `*.schema.ts`, `*.manager.base.ts`, `*.controller.base.ts`
- Backend `*.sanitized.validators.ts`, `list-input-*.ts`
- Backend generated aggregators: `entity.module.ts`, `entity.registry.ts`, `account-deletion-manager.ts`
- Generated frontend/app entity models and API stubs

`*.manager.ts`, `*.controller.ts`, and generated CRUD/admin views may be ENSUREFILE customization points. Check the generated token and local pattern before editing.

---

## XML Schema Reference

### Root Element

```xml
<items projectName="Stencil"
       backendPrefix="backend\src\" 
       frontendPrefix="frontend\src\" 
       nativePrefix="..\..\app\src"
       securityEntity="jurisdiction" 
       securityRoute="jurisdiction_id">
```

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
| `validate` | `"email"` | Validation rule |
| `encrypted` | boolean | Encrypt field value |
| `html` | boolean | Allow HTML content |
| `readOnly` | boolean | Cannot be modified after creation |
| `truncateLog` | boolean | Truncate in logs |
| `idAlias` | boolean | Alternative ID field |
| `tenant` | boolean | This field is the tenant ID |
| `getForSingle` | boolean | Include when fetching single item |

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

Creates `Entity.Public` type with only specified fields. `get="true"` generates a getter method.

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

## Feature Definition (Native App APIs)

Features define API endpoints for the mobile app:

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
3. Confirm regenerated `entity.module.ts`, `entity.registry.ts`, and `account-deletion-manager.ts` include the entity when applicable
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
