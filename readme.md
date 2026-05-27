# Stencil

A code-generation powered full-stack framework where the **XML schema is the source of truth** and AI is the primary author. You describe your data model in XML; a generator produces the boilerplate across both the NestJS backend and React frontend; AI then adapts the generated extension points to add business logic.

## How It Works

```
stencil-entities.xml  →  [XSL Generator]  →  Generated base files (.base.ts, models, API hooks, CRUD views)
                                                      ↓
                                             Extension files (yours to customize)
```

The generator uses two file tokens to manage the output:

| Token | Behavior | Examples |
|-------|----------|---------|
| `STARTFILE` | Recreated on every generator run — never edit | `*.model.ts`, `*.schema.ts`, `*.manager.base.ts`, `*.controller.base.ts`, `*Api.ts` |
| `ENSUREFILE` | Created once, never overwritten — safe to customize | `*.manager.ts`, `*.controller.ts`, `*List.tsx`, `*Editor.tsx` |

### The AI Workflow

1. **Author or edit XML** — define entities, fields, enums, projections, and API features in `server/generation/xml/stencil-entities.xml`
2. **Run the generator** — `server/generation/tools/code-generator-cli.exe` regenerates all `STARTFILE` outputs
3. **Adapt the extensions** — AI reads the generated base files and implements business logic in the corresponding extension files (`*.manager.ts`, `*.controller.ts`, CRUD views)

This means AI is rarely writing boilerplate. It focuses on the XML schema design and the custom logic that differentiates each entity.

## What Gets Generated

### Backend (NestJS)

For each entity with a database collection:

- `{entity}.model.ts` — TypeScript interface and class
- `{entity}.schema.ts` — Mongoose schema
- `{entity}.manager.base.ts` — CRUD operations with hooks (`validate`, `sanitize`, `beforeInsert`, `afterInsert`, etc.)
- `{entity}.manager.ts` *(extension)* — Override hooks, add custom queries
- `{entity}.controller.base.ts` — REST endpoints with permission guards
- `{entity}.controller.ts` *(extension)* — Add custom routes

### Frontend (React)

- `stencil/models/entities/{entity}.ts` — TypeScript types and Zod schemas
- `stencil/endpoints/entities/{entity}Api.ts` — RTK Query hooks (`useGet{Entity}Query`, `useCreate{Entity}Mutation`, etc.)
- `views/super/crud/{entity}/{Entity}List.tsx` *(extension)* — Admin list view with DataTable
- `views/super/crud/{entity}/{Entity}Editor.tsx` *(extension)* — Admin editor form

For each enum: picker components (`{Enum}Picker.tsx`, `{Enum}PickerMulti.tsx`) are generated as extension files.

## XML Schema Concepts

### Entities

```xml
<item name="Widget"
      tenant="Isolated"
      useDocument="true"
      uiDisplayField="title"
      uiDefaultSort="created_utc">

  <field type="string" maxLength="150" searchable="true" uiList="true"
         perspective="Info" friendlyName="Title">title</field>

  <projection name="Public" get="true">
    <entry>_id</entry>
    <entry>title</entry>
  </projection>

  <index name="by_jurisdiction_created">
    <entry direction="Ascending">jurisdiction_id</entry>
    <entry direction="Ascending">created_utc</entry>
  </index>
</item>
```

**Tenant isolation** — every entity declares its isolation pattern:

| Value | Description |
|-------|-------------|
| `Isolated` | Scoped to a jurisdiction; gets a `jurisdiction_id` field and `/admin/:jurisdiction_id/` routes |
| `Shared` | Global, no jurisdiction scoping |
| `Route` | The jurisdiction entity itself |

**Perspectives** — group fields for partial updates. A `perspective="Info"` on multiple fields generates an `updateInfoPerspective()` method on the manager.

**Projections** — named field subsets that generate typed variants (`Widget.Public`) and optional getter methods.

### Enums

```xml
<enum name="WidgetStatus">
  <field value="0" friendlyName="Active">active</field>
  <field value="1" friendlyName="Archived">archived</field>
</enum>
```

### User-Facing API Features

Features define typed API contracts for web/mobile clients. The XML generates RTK Query hooks on the frontend; the backend controllers are implemented manually using the generated types.

```xml
<feature name="auth" area="user" native="true">
  <entity name="RegisterRequest">
    <field type="string">auth_token</field>
    <field type="string">display_name</field>
  </entity>
  <mutation name="register"
            route="v1/auth/register"
            request="params"
            requestType="RegisterRequest"
            itemResult="Account.Self" />
</feature>
```

## Architecture

The backend is a multi-jurisdiction NestJS API deployed as federated Fargate services across multiple AWS regions. Each jurisdiction owns its own MongoDB Atlas cluster. Cross-jurisdiction operations use HMAC-SHA256 signed HTTPS federation calls.

```
Cloudflare (WAF + DNS)
    │
    ├── US ALB → US Fargate → Atlas US (+ Shared DB)
    ├── CA ALB → CA Fargate → Atlas CA
    ├── UK ALB → UK Fargate → Atlas UK
    └── EU ALB → EU Fargate → Atlas EU
                  ◄── Federation HTTPS (HMAC-SHA256) ──►
```

The federation layer is optional. Three deployment topologies are supported:

- **Single-process** (`FEDERATION_MODE=development`) — one process handles all jurisdictions via direct Mongo connections; simplest local dev setup
- **Shared database** — multiple jurisdictions pointing at one Atlas cluster, logically isolated by `jurisdiction_id`
- **Isolated databases** — full production; independent Fargate service and Atlas cluster per jurisdiction

See [`server/api/developers/README.md`](./server/api/developers/README.md) for the full architecture diagram, deployment guide, and operations runbook.

## Getting Started

### Code generator (one-time)

The generator executables are not in source control. After cloning, build them once with the [.NET 8 SDK](https://dotnet.microsoft.com/download) (Windows):

```powershell
cd server/generation/tools/src
.\build_contained.ps1    # self-contained (~50–200 MB each); or build_framework.ps1 if .NET 8 runtime is installed
```

This writes `code-generator.exe` and `code-generator-cli.exe` to `server/generation/tools/`. Re-run after pulling generator source changes.

### API and frontend

```bash
cd server/api

# Install dependencies
npm run install:all

# Configure environment — copy examples, then edit as needed
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start frontend (localhost:3000) + backend (localhost:3001)
npm start
```

`frontend/.env.example` sets `VITE_API_BASE_URL=http://localhost:3001/api` for local dev. Leave all `VITE_FIREBASE_*` values empty unless you are using SSO (must match backend Firebase config). Set `VITE_ADMIN_GATE_TOKEN` only if `ADMIN_GATE_TOKEN` is set on the backend.

**Sign in without SSO** — leave Firebase unset in `backend/.env` and `frontend/.env` (no `FIREBASE_PROJECT_ID` / `VITE_FIREBASE_*`). The app uses local auth; sign in at http://localhost:3000 with:

| Field | Default |
|-------|---------|
| Username | `dev` |
| Password | `dev-secret` |

Override via `DEV_AUTH_USER` and `DEV_AUTH_PASS` in `backend/.env`. With Firebase configured, the sign-in page shows **Sign in with SSO** instead.

To test full federation locally with four isolated instances:

```bash
docker compose -f server/api/docker-compose.federation.yml up --build
# US :3010 | CA :3011 | UK :3012 | EU :3013
```

## Key Files

| Path | Purpose |
|------|---------|
| `server/generation/xml/stencil-entities.xml` | Schema source of truth — edit this to change entities, enums, or features |
| `server/generation/tools/code-generator-cli.exe` | Generator — run after XML changes |
| `server/generation/xsl/` | XSL templates that drive code generation |
| `server/api/backend/src/entities/` | Backend entity implementations |
| `server/api/frontend/src/stencil/` | Generated frontend API layer |
| `server/api/ai/` | AI knowledge base — architecture docs and patterns |
