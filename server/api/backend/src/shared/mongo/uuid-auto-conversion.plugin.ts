import { Schema } from 'mongoose';
import { ModelAnnotations } from '../utils/model-annotations';

export function uuidAutoConversionPlugin(schema: Schema) {
   // Get all UUID fields from the schema (including nested ones)
   const uuidFields = getUUIDFields(schema);

   if (uuidFields.length === 0) {
      return; // No UUID fields, skip plugin
   }

   // Apply to all query operations
   schema.pre(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'updateOne', 'updateMany', 'countDocuments'], function () {
      convertUUIDsInQuery.call(this, uuidFields);
   });

   // Apply to aggregation
   schema.pre('aggregate', function () {
      convertUUIDsInAggregation.call(this, uuidFields);
   });
}

function getUUIDFields(schema: Schema): string[] {
   const uuidFields: string[] = [];
   const visitedSchemas = new Set<Schema>();

   schema.eachPath((path, schemaType) => {
      // Check if field uses Binary type (which UUIDs use)
      const hasBinaryType = schemaType.instance === 'Binary';

      // Check for getters/setters using type assertion
      const schemaTypeAny = schemaType as any;
      const hasGetters = schemaTypeAny.getters && Object.keys(schemaTypeAny.getters).length > 0;
      const hasSetters = schemaTypeAny.setters && Object.keys(schemaTypeAny.setters).length > 0;

      if (hasBinaryType || (hasGetters && hasSetters)) {
         uuidFields.push(path);
      }

      // Check for nested schemas (subdocuments)
      if (schemaType.instance === 'Embedded' || schemaType.instance === 'Array') {
         const nestedUUIDFields = getNestedUUIDFields(path, schemaType, visitedSchemas);
         uuidFields.push(...nestedUUIDFields);
      }
   });

   return uuidFields;
}

function getNestedUUIDFields(parentPath: string, schemaType: any, visitedSchemas: Set<Schema>): string[] {
   const nestedUUIDFields: string[] = [];

   // Handle embedded documents
   if (schemaType.instance === 'Embedded' && schemaType.schema) {
      const nestedSchema = schemaType.schema;

      // Prevent infinite loops with circular references
      if (visitedSchemas.has(nestedSchema)) {
         return nestedUUIDFields;
      }

      visitedSchemas.add(nestedSchema);

      nestedSchema.eachPath((nestedPath: string, nestedSchemaType: any) => {
         const hasBinaryType = nestedSchemaType.instance === 'Binary';
         const hasGetters = nestedSchemaType.getters && Object.keys(nestedSchemaType.getters).length > 0;
         const hasSetters = nestedSchemaType.setters && Object.keys(nestedSchemaType.setters).length > 0;

         if (hasBinaryType || (hasGetters && hasSetters)) {
            nestedUUIDFields.push(`${parentPath}.${nestedPath}`);
         }

         // Recursively check for deeper nesting
         if (nestedSchemaType.instance === 'Embedded' || nestedSchemaType.instance === 'Array') {
            const deeperNestedFields = getNestedUUIDFields(`${parentPath}.${nestedPath}`, nestedSchemaType, visitedSchemas);
            nestedUUIDFields.push(...deeperNestedFields);
         }
      });
   }

   // Handle arrays of embedded documents
   if (schemaType.instance === 'Array' && schemaType.schema) {
      const arraySchema = schemaType.schema;

      // Prevent infinite loops with circular references
      if (visitedSchemas.has(arraySchema)) {
         return nestedUUIDFields;
      }

      visitedSchemas.add(arraySchema);

      arraySchema.eachPath((nestedPath: string, nestedSchemaType: any) => {
         const hasBinaryType = nestedSchemaType.instance === 'Binary';
         const hasGetters = nestedSchemaType.getters && Object.keys(nestedSchemaType.getters).length > 0;
         const hasSetters = nestedSchemaType.setters && Object.keys(nestedSchemaType.setters).length > 0;

         if (hasBinaryType || (hasGetters && hasSetters)) {
            nestedUUIDFields.push(`${parentPath}.${nestedPath}`);
         }

         // Recursively check for deeper nesting
         if (nestedSchemaType.instance === 'Embedded' || nestedSchemaType.instance === 'Array') {
            const deeperNestedFields = getNestedUUIDFields(`${parentPath}.${nestedPath}`, nestedSchemaType, visitedSchemas);
            nestedUUIDFields.push(...deeperNestedFields);
         }
      });
   }

   return nestedUUIDFields;
}

function convertUUIDsInQuery(uuidFields: string[]) {
   const filter = this.getQuery();
   convertUUIDsInObject(filter, uuidFields);
}

function convertUUIDsInAggregation(uuidFields: string[]) {
   const pipeline = this.pipeline();

   pipeline.forEach((stage: any, index: number) => {
      if (stage.$match) {
         convertUUIDsInObject(stage.$match, uuidFields);
      }
   });
}

// MongoDB operators that contain values to be converted (not field names)
const MONGO_VALUE_OPERATORS = ['$in', '$nin', '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$all'];

function convertUUIDsInObject(obj: any, uuidFields: string[], parentFieldName?: string) {
   if (!obj || typeof obj !== 'object') {
      return;
   }

   for (const [key, value] of Object.entries(obj)) {
      // Determine if current key is a MongoDB operator
      const isOperator = key.startsWith('$');
      // Use parent field name if we're inside an operator, otherwise use current key
      const fieldNameToCheck = isOperator ? parentFieldName : key;
      const isUUIDField = fieldNameToCheck && uuidFields.includes(fieldNameToCheck);

      // Check for exact field match
      if (isUUIDField && typeof value === 'string') {
         obj[key] = ModelAnnotations.stringToBinary(value);
      }
      // Handle arrays (like $in queries)
      else if (Array.isArray(value)) {
         value.forEach((item, index) => {
            if (isUUIDField && typeof item === 'string') {
               value[index] = ModelAnnotations.stringToBinary(item);
            } else if (typeof item === 'object' && item !== null) {
               convertUUIDsInObject(item, uuidFields);
            }
         });
      } else if (typeof value === 'object' && value !== null) {
         // Handle nested objects and MongoDB operators
         // Pass field name context when recursing into operators
         convertUUIDsInObject(value, uuidFields, isOperator ? parentFieldName : key);
      }
   }
}
