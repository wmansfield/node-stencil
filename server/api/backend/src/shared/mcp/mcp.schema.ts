import { JsonSchema, JsonSchemaProperties, McpSchemaMode } from './mcp.types';

/**
 * Nullable fields are optional on input (validators accept absence) and may be `null` on output,
 * because MCP clients validate structuredContent against the tool's outputSchema.
 */
export function schemaProperty(mode: McpSchemaMode, schema: JsonSchema, nullable: boolean): JsonSchema {
   if (!nullable || mode === McpSchemaMode.input) {
      return schema;
   }
   const { title, description, ...core } = schema;
   const wrapped: JsonSchema = { anyOf: [core, { type: 'null' }] };
   if (title !== undefined) {
      wrapped.title = title;
   }
   if (description !== undefined) {
      wrapped.description = description;
   }
   return wrapped;
}

/**
 * Input objects are closed and list their required fields (Sanitize rejects unknown keys).
 * Output objects stay open and list no required fields, so a missing optional value in stored
 * data never fails client-side validation.
 */
export function objectSchema(mode: McpSchemaMode, properties: JsonSchemaProperties, required: string[]): JsonSchema {
   if (mode === McpSchemaMode.output) {
      return { type: 'object', properties };
   }
   const schema: JsonSchema = { type: 'object', properties, additionalProperties: false };
   if (required.length > 0) {
      schema.required = required;
   }
   return schema;
}

/** Input schema for a tool whose operation takes no request. */
export function emptyInputSchema(): JsonSchema {
   return { type: 'object', properties: {}, additionalProperties: false };
}

/** Output schema for a tool whose operation returns a list; structuredContent is `{ items }`. */
export function listOutputSchema(item: JsonSchema): JsonSchema {
   return { type: 'object', properties: { items: { type: 'array', items: item } } };
}
