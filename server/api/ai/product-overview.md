# Stencil — Product Overview

## What is Stencil?

Stencil is a full-stack application template: a React admin frontend, NestJS backend, and optional React Native mobile app scaffold. Most of the codebase is generated from a single XML schema; you customize extension files to implement your product's business logic.

The core idea: **describe your data model once, generate the boilerplate everywhere.**

## What the Template Provides

- **Multi-jurisdiction architecture** — entities can be shared, isolated per jurisdiction, or route-scoped; federation utilities support cross-region deployments.
- **Code generation** — entities, enums, projections, admin CRUD views, and mobile API contracts are generated from `stencil-entities.xml`.
- **User features** — auth, media upload, and profile endpoints are included as reference implementations.
- **Admin panel** — web-based operator dashboard for managing jurisdictions, accounts, assets, and platform settings.
- **Mobile scaffold** — React Native app structure with generated API hooks (outside this `server/api` folder, at `app/src/`).

## Starter Entities

The default schema includes foundational entities such as:

- **Account**, **GlobalAccount** — user identity and cross-jurisdiction lookup
- **Jurisdiction**, **JurisdictionSetting**, **JurisdictionAsset** — tenant isolation and media storage
- **Widget** — a simple isolated entity useful as a CRUD example
- **Role**, **Timezone**, **GlobalSetting** — shared platform configuration

Replace or extend these when building your product.

## Security and Privacy Baselines

Stencil ships with patterns for:

- **Firebase Auth** — JWT validation and account provisioning
- **Jurisdiction-scoped data access** — user routes derive tenant from `request.account.jurisdiction_id`
- **Input sanitization** — feature controllers use `Sanitize.for()` on every `@Body()`
- **Privacy-aware logging** — avoid logging full auth identifiers (see `privacy-logging.mdc`)

Add product-specific encryption, sharing, or compliance requirements in your extension files and XML schema.

## Platform

- **Backend** — NestJS + MongoDB (Mongoose)
- **Admin frontend** — React 18 + Vite + Redux Toolkit
- **Mobile app** — React Native (optional, in `app/`)
- **Deployment** — federated multi-region setup documented in `developers/README.md`

## Customizing for Your Product

1. Rename or extend entities in `server/generation/xml/stencil-entities.xml`
2. Run the generator
3. Implement business logic in extension files (`*.manager.ts`, feature controllers, CRUD views)
4. Update this file (or add a product-specific doc) with your domain concepts when they diverge from the template defaults
