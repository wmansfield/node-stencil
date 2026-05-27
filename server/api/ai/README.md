# AI Knowledge Base

This folder contains documentation to help AI assistants understand and work with the Stencil codebase efficiently.

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
2. Run generator (server/generation/tools/code-generator-cli.exe)
3. Customize extension files (NOT .base.ts files)
```

## Critical Rules

1. **NEVER edit `.base.ts` files** - They are regenerated and changes will be lost
2. **Edit XML for schema changes** - New fields, entities, enums, projections
3. **Edit extension files for custom logic** - `.manager.ts`, `.controller.ts`, CRUD views
4. **Run the generator** after XML changes to regenerate base files
5. **Follow `.cursor/rules/`** - Cursor rules are strict; if they conflict with this folder, update the stale docs

## File Quick Reference

| File | When to Read |
|------|--------------|
| `ruleset.md` | Starting any non-trivial task or deciding rule strictness |
| `code-generation.md` | Adding/modifying entities, fields, enums, or APIs |
| `project-overview.md` | Understanding architecture or tech stack |
| `patterns/extending-generated-code.md` | Adding custom business logic |
| `patterns/features-api.md` | Working with native app API endpoints |
| `patterns/feature-controllers.md` | Implementing or reviewing feature controllers |
| `patterns/federation-and-dual-homed.md` | Working with dual-homed entities, federation, sync, or tombstones |
| `verification.md` | Checking invariants and test expectations before finishing |

## Cursor Rules

Rules in `.cursor/rules/` are concise enforcement files. Important rules include:

- `code-generation-workflow.mdc` - XML-first workflow and generated file ownership
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

- **XML Source**: `../generation/xml/stencil-entities.xml` (from `server/api`)
- **Generator CLI**: `../generation/tools/code-generator-cli.exe`
- **XSL Templates**: `../generation/xsl/`
