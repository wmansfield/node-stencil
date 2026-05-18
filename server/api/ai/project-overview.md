# Project Overview

A full-stack application with a React admin frontend and NestJS backend, built on a code generation system driven by XML entity definitions.

## Tech Stack

### Backend (`backend/`)
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: Firebase Auth
- **Language**: TypeScript

### Frontend (`frontend/`)
- **Framework**: React with Vite
- **State Management**: Redux Toolkit + RTK Query
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Project Structure

```
server/api/
├── backend/src/
│   ├── config/          # Configuration modules
│   ├── entities/        # Entity folders (model, schema, manager, controller)
│   ├── features/        # Feature-specific business logic
│   ├── shared/          # Shared utilities, types, managers
│   └── tasks/           # Background tasks and services
├── frontend/src/
│   ├── components/      # Reusable UI components
│   ├── stencil/         # API layer (endpoints, models)
│   └── views/           # Page components and CRUD views
└── ai/                  # This knowledge base
```

## Key Architectural Concepts

### Jurisdiction Isolation

Entities are isolated by jurisdiction (tenant). Three patterns exist:

| Tenant Type | Description | Example |
|-------------|-------------|---------|
| `Shared` | Global, no jurisdiction scoping | Role, Timezone, GlobalSetting |
| `Isolated` | Scoped to a jurisdiction | Account, Asset, Widget |
| `Route` | Jurisdiction IS the entity | Jurisdiction |

All isolated entities have a `jurisdiction_id` field and admin routes are prefixed with `/admin/:jurisdiction_id/`.

### Base vs Extension Pattern

Generated code uses a base/extension pattern:
- `.base.ts` files are **generated** - never edit directly
- `.ts` files are **extensions** - safe to customize

Example:
- `account.manager.base.ts` - Generated CRUD operations
- `account.manager.ts` - Custom business logic (extends base)

### Perspectives

Entities can have "perspectives" — logical groupings of fields that can be updated independently:

```xml
<field type="string" perspective="Status" friendlyName="Email">email</field>
<field type="AccountStatus" perspective="Status" friendlyName="Status">account_status</field>
```

This generates methods like `updateStatusPerspective()` for partial updates.

### Projections

Different views of an entity for different use cases:

```xml
<projection name="Public">
  <entry>_id</entry>
  <entry>display_name</entry>
</projection>
```

Generates `Account.Public` type with only those fields.

## Environment Setup

### Development
```bash
npm run install:all
npm start  # Starts both frontend (3000) and backend (3001)
```

## Key Files

| File | Purpose |
|------|---------|
| `server/generation/xml/stencil-entities.xml` | Entity definitions (source of truth) |
| `backend/src/entities/*/` | Backend entity implementations |
| `frontend/src/stencil/` | Frontend API layer and models |
| `frontend/src/views/super/crud/` | Admin CRUD views |
