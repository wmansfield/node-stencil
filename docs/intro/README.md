# Introducing Stencil

Software products repeat the same facts in many places. “A Widget has a title, belongs to a region, and can be listed and edited.” That fact has to show up as a database shape, an API, an admin screen, and types the UI can trust. When those copies are typed by hand, they drift: the form asks for a field the API never stored; the list shows a field nobody meant to expose.

**Code generation** means a program writes those repetitive copies from **one description**. A person (or an AI) maintains the description. The machine keeps the copies aligned.

Not all generators work the same way:

| Kind | What happens |
|------|----------------|
| Write-once scaffold | Files are created once, then humans own them. The generator is a starter kit. |
| Regenerating | The description is still the source of truth. Running the generator **overwrites** the copies. Custom work lives in marked extension points so it is not erased. |

**Stencil is regenerating.** The description is an XML schema (`stencil-entities.xml`). From it, Stencil produces the NestJS backend pieces and the React admin pieces that would otherwise be copy-paste: models, database schemas, CRUD, types, list/editor screens, permission names. Run the generator again after a schema change; the generated files update together.

What the generator does *not* invent is product judgment: “subtitle cannot equal title,” “this list is public but that field is not,” “when a child row changes, mark the parent stale.” That logic sits in **small extension files** the generator will not overwrite, and in **hooks** the generated code already calls (validate, sanitize, calculate).

Three ideas follow from that, independent of language background:

1. **The schema is the contract.** If a field, index, or API shape matters, it belongs in XML. Parallel handwritten models are how drift returns.
2. **Generated files are not the place to keep edits.** Change the description, regenerate. Custom rules go in the extension files.
3. **Reads and writes have named shapes.** A *projection* is which fields this caller is allowed to see. A *perspective* is which fields this write is allowed to change. Worked example: [Perspectives and projections](./perspectives-and-projections.md). A *manager* is the only door that actually changes stored data.

The rest of this folder is detail: how Mongo differs from SQL, how the same ideas map from C# or Python, and the working manuals under `server/api/ai/`. Open this git root as the Cursor workspace so project rules bind.

| Page | Contents |
|------|----------|
| [Overview](./for-everyone.md) | Workflow vocabulary: XML, files rewritten every run vs kept extensions, managers, jurisdiction, tombstones. |
| [Perspectives and projections](./perspectives-and-projections.md) | Named reads (what a caller may see) and named writes (what an update may change). |
| [Localized content](./localized-content.md) | Default-language fields, translation arrays, and the feature read that copies a language back into those fields. |
| [Memory cache](./memory-cache.md) | In-process cache for hot reads: permissions, settings, account resolution, storage signatures. |
| [Mongo is not SQL](./mongo-is-not-sql.md) | Document vs row, write-time snapshots, indexes, tenancy. |
| [For C# developers](./for-csharp.md) | ASP.NET / SQL Server / DataLayer / stored-proc mappings. |
| [For Python developers](./for-python.md) | FastAPI / SQLAlchemy / Pydantic / Alembic mappings. |
| [Training track](../training/README.md) | Kanban (boards → lists → cards), three levels of who holds the pen. |

Working manuals: [`code-generation.md`](../../server/api/ai/code-generation.md), [`enterprise-features.md`](../../server/api/ai/enterprise-features.md).
