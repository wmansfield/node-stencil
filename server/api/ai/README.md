# AI Knowledge Base

This folder contains documentation to help AI assistants understand and work with this codebase efficiently.

## How to Use This Folder

**Before starting any work, read these files in order:**

1. **`code-generation.md`** - CRITICAL: Most code is generated from XML. Read this first for any entity, API, or CRUD work.
2. **`project-overview.md`** - Architecture, tech stack, and project structure.
3. **`patterns/`** - Specific patterns for extending generated code and working with features.

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

## File Quick Reference

| File | When to Read |
|------|--------------|
| `code-generation.md` | Adding/modifying entities, fields, enums, or APIs |
| `project-overview.md` | Understanding architecture or tech stack |
| `patterns/extending-generated-code.md` | Adding custom business logic |
| `patterns/features-api.md` | Working with user-facing API feature endpoints |

## Updating This Knowledge Base

When patterns change or new conventions emerge:
1. Update the relevant documentation file
2. Add new pattern files to `patterns/` if needed
3. Keep examples current with actual code

## Generator Location

- **XML Source**: `../../../generation/xml/stencil-entities.xml` (relative to this folder)
- **Generator CLI**: `../../../generation/tools/code-generator-cli.exe`
- **XSL Templates**: `../../../generation/xsl/`
