# AI Knowledge Base

This folder contains documentation to help AI assistants understand and work with the Stencil codebase efficiently.

Human-facing intro lives in [`docs/intro/`](../../docs/intro/README.md) (overview, Mongo vs SQL, C# and Python mappings).

## How to Use This Folder

**Before starting any work, read these files in order:**

1. **`ruleset.md`** - Strictness levels, hard rules, and task recipes.
2. **`code-generation.md`** - CRITICAL: Most code is generated from XML. Read this first for any entity, API, or CRUD work.
3. **`project-overview.md`** - Architecture, tech stack, and project structure.
4. **`patterns/`** - Specific patterns for extending generated code, feature controllers, federation, and verification.

## Core Principle: XML-First Development

The codebase uses code generation. The workflow is:

```
1. Edit XML (server/generation/xml/stencil-entities.xml)
2. Run generator (server/generation/tools/code-generator-cli.exe — CLI only; src/generate.ps1 builds it if missing)
3. Customize extension files (NOT .base.ts files)
```

## Critical Rules

1. **NEVER edit `.base.ts` files** - They are regenerated and changes will be lost
2. **Edit XML for schema changes** - New fields, entities, enums, projections
3. **Edit extension files for custom logic** - `.manager.ts`, `.controller.ts`, CRUD views
4. **Run the generator** after XML changes to regenerate base files
5. **Follow repo-root `.cursor/rules/`** - Cursor rules are strict; if they conflict with this folder, update the stale docs. Open the git root as the workspace so those rules bind.

## File Quick Reference

| File | When to Read |
|------|--------------|
| `ruleset.md` | Starting any non-trivial task or deciding rule strictness |
| `code-generation.md` | Adding/modifying entities, fields, enums, or APIs |
| `enterprise-features.md` | Tenancy, federation, encryption, observability, sliceable deploys, schema-gated change |
| `project-overview.md` | Understanding architecture or tech stack |
| `patterns/extending-generated-code.md` | Adding custom business logic |
| `patterns/features-api.md` | Feature HTTP contracts and the generated TypeScript client |
| `patterns/feature-controllers.md` | Implementing or reviewing feature controllers |
| `patterns/federation-and-dual-homed.md` | Working with dual-homed entities, federation, sync, or tombstones |
| `patterns/account-deletion.md` | Schema-owned physical account erasure (DSAR) |
| `patterns/calculated-fields-and-references.md` | Adding computed fields or computed references (projection of a foreign entity) |
| `patterns/localized-content.md` | Default-language fields and the feature read that copies a translation onto them |
| `patterns/webhook-ingestion.md` | Consuming inbound webhooks (queue + scheduled/manual processor) |
| `patterns/mcp.md` | Exposing feature operations as MCP tools (`<mcp>` in XML, controller implements the contract) |
| `verification.md` | Checking invariants and test expectations before finishing |

## Cursor Rules

Canonical rules live at the **repository root**: `.cursor/rules/` (not under `server/api/.cursor/`). They are concise enforcement files. Important rules include:

- `training-clone-bounds.mdc` / `stencil-hard-rules.mdc` - clone purpose, workspace root, and always-on invariants
- `code-generation-workflow.mdc` - XML-first workflow and generated file ownership
- `json-packed-fields.mdc` / `schema-comment-scope.mdc` / `schema-evolution.mdc` / `schema-field-names.mdc` - XML types, comments, additive schema, specific field names
- `dual-homed-query-pattern.mdc` - `local_account_id` perspective scoping
- `federated-tombstones.mdc` - tombstones for sync/federated normal deletes
- `feature-controller-sanitize.mdc` - `Sanitize.for()` / `Sanitize.ignore()` on every feature `@Body()`
- `interface-contract-integrity.mdc` and `typescript-*.mdc` - TypeScript contract/style rules

Long-form examples live in this `ai/` folder; strict enforcement lives in the rules.

## Updating This Knowledge Base

When patterns change or new conventions emerge:
1. Update the relevant documentation file
2. Add new pattern files to `patterns/` if needed
3. Keep examples current with actual code

## Generator Location

From the git root (preferred Cursor workspace):

- **XML Source**: `server/generation/xml/stencil-entities.xml`
- **Generator CLI**: `server/generation/tools/code-generator-cli.exe` (or `code-generator-cli`). If missing, `server/generation/tools/src/generate.ps1` / `generate.sh`
- **XSL Templates**: `server/generation/xsl/`

From `server/api`, those paths are `../generation/xml/`, `../generation/tools/`, and `../generation/xsl/`.
