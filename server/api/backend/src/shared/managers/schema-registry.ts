import { CollectionDefinition } from '../types/mongo/collection-definition.types';

const schemaRegistry = new Map<string, CollectionDefinition>();

export function registerSchema(info: CollectionDefinition) {
   schemaRegistry.set(info.name, info);
}

export function getAllSchemas(): CollectionDefinition[] {
   return Array.from(schemaRegistry.values());
}
