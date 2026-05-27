import { getSanitizedValidators } from 'src/shared/utils/sanitized.registry';

/**
 * Map of field names to their nested class constructors for recursive shape checking.
 *
 * - `Function`    → nested object: validate with that class's validators
 * - `[Function]`  → array of nested objects: validate each element
 *
 * Example:
 *   { avatar: MediaInfo, roles: [string] }
 */
export type NestedTypeMap = Record<string, Function | [Function]>;

/**
 * Recursively validates that a JSON response item contains ONLY the fields
 * defined for the given class, at every depth.
 *
 * Catches data leakage where TypeScript's structural typing silently allows
 * extra fields to pass through. Uses the SanitizedValidatorMap registry as
 * the source of truth for allowed keys and field types.
 *
 * @param item         The parsed JSON response item to validate
 * @param ctor         The class constructor whose validators define the expected shape
 * @param nestedTypes  Optional map of field name → nested class constructor for recursive checking
 * @param path         Internal: dot-path for descriptive error messages
 */
export function expectStrictResponseShape(
   item: any,
   ctor: Function,
   nestedTypes?: NestedTypeMap,
   path: string = ctor.name ?? 'root',
): void {
   if (item == null) {
      throw new Error(`Expected object at "${path}" but got ${item}`);
   }

   const validators = getSanitizedValidators(ctor);
   if (!validators) {
      throw new Error(
         `No sanitized validators registered for "${ctor.name ?? 'unknown'}". ` +
         'Ensure the corresponding *.sanitized.validators.ts file is imported.',
      );
   }

   const allowedKeys = new Set(Object.keys(validators));
   const actualKeys = Object.keys(item);

   // ---------------------------------------------------------------
   // 1. Data leakage check — no extra keys
   // ---------------------------------------------------------------
   // NOTE: MongoDB auto-adds `_id` to embedded subdocuments unless the schema
   // explicitly sets `_id: false`. This is a known codegen issue — generated
   // subdocument schemas use ModelAnnotations.document but not suppress_id.
   // Until fixed in codegen, we tolerate `_id` on nested objects (non-root path).
   const isNested = path.includes('.');
   const extraKeys = actualKeys.filter(k => {
      if (allowedKeys.has(k)) return false;
      if (isNested && k === '_id') return false; // tolerate MongoDB auto-_id on subdocuments
      return true;
   });
   if (extraKeys.length > 0) {
      throw new Error(
         `Data leakage at "${path}": unexpected keys [${extraKeys.join(', ')}]. ` +
         `Allowed: [${[...allowedKeys].join(', ')}]`,
      );
   }

   // ---------------------------------------------------------------
   // 2. Type validation — run each field's validator
   // ---------------------------------------------------------------
   for (const [key, validator] of Object.entries(validators)) {
      if (item[key] !== undefined) {
         try {
            validator(item[key]);
         } catch (err: any) {
            throw new Error(
               `Type violation at "${path}.${key}": ${err.message ?? err}`,
            );
         }
      }
   }

   // ---------------------------------------------------------------
   // 3. Recurse into nested types for deeper key checking
   // ---------------------------------------------------------------
   if (nestedTypes) {
      for (const [field, spec] of Object.entries(nestedTypes)) {
         if (item[field] == null) continue;

         const isArray = Array.isArray(spec);
         const nestedCtor = isArray ? spec[0] : spec;

         if (isArray && Array.isArray(item[field])) {
            (item[field] as any[]).forEach((el, i) => {
               expectStrictResponseShape(el, nestedCtor, undefined, `${path}.${field}[${i}]`);
            });
         } else if (!isArray && typeof item[field] === 'object') {
            expectStrictResponseShape(item[field], nestedCtor, undefined, `${path}.${field}`);
         }
      }
   }
}

/**
 * Validates every item in a ListResult response body.
 *
 * @param body         The full response body (expects `{ items: [...] }`)
 * @param ctor         The class constructor for each item
 * @param nestedTypes  Optional nested type map
 */
export function expectStrictListShape(
   body: any,
   ctor: Function,
   nestedTypes?: NestedTypeMap,
): void {
   expect(body.items).toBeDefined();
   expect(Array.isArray(body.items)).toBe(true);

   for (let i = 0; i < body.items.length; i++) {
      expectStrictResponseShape(body.items[i], ctor, nestedTypes, `${ctor.name}[${i}]`);
   }
}

/**
 * Validates the `item` inside an ItemResult response body.
 *
 * @param body         The full response body (expects `{ item: {...} }`)
 * @param ctor         The class constructor for the item
 * @param nestedTypes  Optional nested type map
 */
export function expectStrictItemShape(
   body: any,
   ctor: Function,
   nestedTypes?: NestedTypeMap,
): void {
   expect(body.item).toBeDefined();
   expectStrictResponseShape(body.item, ctor, nestedTypes, ctor.name);
}
