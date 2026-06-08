# Calculated Fields and Computed References

Calculated fields are generated fields whose values are filled by manager logic.
A common use is a **computed reference**: store a small snapshot of a related
entity next to its foreign-key id so lists and detail views can show useful data
without fetching the full related entity.

Declare the fields in `generation/xml/stencil-entities.xml`, run the generator,
then implement `applyCalculations` in the generated entity's ENSUREFILE manager.

## When to use a computed reference

A foreign-key id such as `thing_id` is not useful in a UI by itself. If the
referenced entity has a stable display identity, store a small projection beside
the id:

- `thing_id`: the foreign-key id.
- `thing`: a calculated projection such as `Thing.Reference`.

Use this for small, display-oriented snapshots. Do not use it to copy large
objects or replace normal queries.

## XML Shape

The pattern has three parts. Replace `Thing` and `Widget` with your entity names.

### 1. Projection on the Referenced Entity

Add a projection with only the fields needed by the referencing entity. Use
`get="true"` so the generator emits a projected getter such as
`thingManager.getByIdReference(...)`.

```xml
<item name="Thing" ...>
  ...
  <projection name="Reference" get="true">
    <entry>_id</entry>
    <entry>display_name</entry>
  </projection>
</item>
```

This generates:

- `Thing.Reference`
- `thing.toReference()`
- `thingManager.getByIdReference(...)`

### 2. Calculated Field on the Referencing Entity

Add a calculated field typed as the projection.

```xml
<item name="Widget" ...>
  ...
  <field calculated="other" type="Thing.Reference" isNullable="true" isClass="true" friendlyName="Thing">thing</field>
</item>
```

Use `calculated="other"` when the value comes from another entity or external
source.

### 3. Recalculate Flag on the Input Field

Mark the foreign-key field with `recalculate="true"` so the generated
`CalculationSource` exposes it to `applyCalculations`.

```xml
<field type="Uuid" isNullable="true" foreignKey="Thing" foreignKeyField="_id" recalculate="true" friendlyName="Thing">thing_id</field>
```

Only fields marked for recalculation are reliable calculation inputs.

## Manager Hook

After running the generator, implement `applyCalculations` in
`backend/src/entities/widget/widget.manager.ts`.

```ts
protected override async applyCalculations(
   source: Widget.CalculationSource,
   destination: Widget.CalculationsPerspective,
): Promise<void> {
   if (source.thing_id) {
      destination.thing = await this.entities.thingManager.getByIdReference(source.thing_id);
   } else {
      destination.thing = null;
   }
}
```

If the referenced manager requires a tenant, account, or jurisdiction argument,
derive that routing value from `source.getActual()` and pass it to the generated
projected getter.

Prefer the generated projected getter over loading the full entity and calling
`.toReference()`. The projected getter fetches only the fields in the projection.

## Hook Rules

- Read calculation inputs from `source.<field>`.
- Use `source.getActual()` only for routing fields needed to perform the lookup.
- Assign calculated outputs to `destination.<calculatedField>`.
- Keep the hook deterministic; avoid side effects beyond setting destination
  fields.

Reading arbitrary values from `source.getActual()` bypasses calculation change
detection and can leave persisted calculations stale.

## How It Runs

Generated `insert` and `replace` flows call:

```text
calculateAndPersist(document) -> calculate(document) -> applyCalculations(source, destination)
```

The calculated fields are persisted with generated calculation metadata such as
`calculation_utc`, `calculation_agent`, and `calculation_reason`.

## `calculated="self"` vs `calculated="other"`

| Value | Meaning | Example |
|---|---|---|
| `self` | Computed from fields on the same entity | `email_normalized` from `email` |
| `other` | Computed by fetching another entity or external value | `thing` from `thing_id` |

Both use `applyCalculations`. Inputs still need `recalculate="true"` unless the
calculated field is derived from another field that already triggers
recalculation.

## Freshness

A computed reference is snapshotted when the referencing entity is written. If the
referenced entity changes later, the snapshot can become stale until the
referencing row is recalculated.

If referenced-entity changes should automatically invalidate the snapshot, add
`foreignKeyInvalidatesMe="true"` to the foreign-key field:

```xml
<field type="Uuid" foreignKey="Thing" foreignKeyField="_id" recalculate="true" foreignKeyInvalidatesMe="true">thing_id</field>
```

Use this when the projected fields change often enough that stale snapshots would
matter.

## Cross-Tenant References

If a foreign key points across tenant boundaries, generated existence checks and
cascades may not apply. Mark the field with `fakeForeignKey="true"` when the
relationship cannot be enforced by the generated manager.

The computed reference can still work, but the hook owns lookup behavior and
missing-reference handling.

## Checklist

1. Add a small `Reference` projection with `get="true"` to the referenced entity.
2. Add a calculated `isClass` field typed as that projection.
3. Add `recalculate="true"` to the foreign-key input field.
4. Run the generator from `server/generation/tools`.
5. Implement `applyCalculations` in the entity manager ENSUREFILE.
6. Add `foreignKeyInvalidatesMe="true"` only when the snapshot must follow
   referenced-entity edits.

See `ai/code-generation.md` for the full field-attribute reference.
