import { Connection, ConnectOptions, createConnection } from 'mongoose';
import { ConfigResolver } from '../../config/config.resolver';
import { Injectable, Logger } from '@nestjs/common';
import { Binary } from 'mongodb';
import { Mutex } from 'async-mutex';
import { getAllSchemas } from '../managers/schema-registry';
import { EncryptedField } from '../types/mongo/collection-definition.types';
import { buildAutoEncryptionOptions, buildEncryptedFieldsMap, ensureDataKey } from './mongo-queryable-encryption';
import { KeyTemplates, TENANT_TTL_MS } from './mongo.constants';
import { ConfigTemplates } from 'src/config/config.templates';

interface ConnectionInfo {
   connection: Connection;
   lastUsed: number;
}

@Injectable()
export class MongoConnectionProvider {
   private readonly logger = new Logger(MongoConnectionProvider.name);

   private tenantCache = new Map<string, ConnectionInfo>();
   private tenantLocks = new Map<string, Mutex>();
   private encryptionCache: Map<string, Binary> = new Map();

   constructor(private readonly configResolver: ConfigResolver) {}

   async getTenantConnection(tenant_code: string): Promise<Connection> {
      const key = `${tenant_code}`;
      if (!this.tenantLocks.has(key)) {
         this.tenantLocks.set(key, new Mutex());
      }

      const mutex = this.tenantLocks.get(key)!;

      return await mutex.runExclusive(async () => {
         let cachedItem = this.tenantCache.get(key);

         if (!cachedItem) {
            const tenantConnection = await this.createTenantConnection(tenant_code);
            cachedItem = {
               connection: tenantConnection,
               lastUsed: Date.now(),
            };

            this.tenantCache.set(key, cachedItem);
         }

         cachedItem.lastUsed = Date.now();
         return cachedItem.connection;
      });
   }

   private async createTenantConnection(tenant_code: string): Promise<Connection> {
      this.logger.log(`Creating connection for ${tenant_code}`);

      const config = await this.configResolver.getTenantConfig(tenant_code);
      if (!config?.mongo) {
         throw new Error(`No MongoDB configuration for tenant: ${tenant_code}`);
      }

      // Get or create encryption keys
      const uri = config.mongo.uri;
      const keyId = KeyTemplates.TenantDataKey(tenant_code);
      let dataKey = this.encryptionCache.get(keyId);

      if (!dataKey) {
         dataKey = await ensureDataKey(this.configResolver, config, keyId);
         this.encryptionCache.set(keyId, dataKey);
      }

      // Configure Mongoose connection
      let options: ConnectOptions = {
         bufferCommands: false,
         dbName: config.mongo.database,
         maxPoolSize: config.mongo.maxPoolSize || 30,
         minPoolSize: config.mongo.minPoolSize || 5,
      };

      // Get standard schema
      const collectionDefinitions = getAllSchemas();

      // Configure encrypted fields
      const collectionsWithEncryption = collectionDefinitions.filter(x => x.encryptedFields && x.encryptedFields.length > 0);
      if (collectionsWithEncryption.length > 0) {
         const encryptionDatabase = await this.configResolver.getValue(ConfigTemplates.EncryptionDatabase());
         const encryptionCollection = await this.configResolver.getValue(ConfigTemplates.EncryptionCollection());
         if (!encryptionDatabase || !encryptionCollection) {
            throw new Error('Missing encryption database and collection');
         }

         const autoEncryptionOptions = buildAutoEncryptionOptions(config, encryptionDatabase, encryptionCollection);
         const encryptedFieldsMap = buildEncryptedFieldsMap(config.mongo.database, dataKey, collectionsWithEncryption);

         options = {
            ...options,
            autoEncryption: {
               ...autoEncryptionOptions.autoEncryption,
               encryptedFieldsMap: encryptedFieldsMap,
            },
         };
      }

      // Create Mongoose connection
      const tenantConnection = await createConnection(uri, options).asPromise();

      // Assign schema
      for (const definition of collectionDefinitions) {
         // Ensure all collections with encryption already exist
         if (definition.encryptedFields && definition.encryptedFields.length > 0) {
            const existing = await tenantConnection.db!.listCollections({ name: definition.name }).toArray();

            if (existing.length === 0) {
               const encryptedFields: EncryptedField[] = definition.encryptedFields.map(x => ({ ...x, keyId: dataKey }));
               await tenantConnection.db!.createCollection(definition.name, {
                  encryptedFields: {
                     fields: encryptedFields,
                  },
               });
            }
         }

         tenantConnection.model(definition.name, definition.schema, definition.name);
      }
      return tenantConnection;
   }

   async evictConnection(tenant_code: string): Promise<void> {
      const key = `${tenant_code}`;
      if (!this.tenantLocks.has(key)) {
         return;
      }

      const mutex = this.tenantLocks.get(key)!;
      await mutex.runExclusive(async () => {
         const cached = this.tenantCache.get(key);
         if (cached) {
            try {
               await cached.connection.close();
            } catch (err) {
               this.logger.warn(`Error closing evicted connection for ${tenant_code}`, err);
            }
            this.tenantCache.delete(key);
            this.logger.log(`Evicted connection for ${tenant_code}`);
         }
      });
   }

   async closeConnections(): Promise<void> {
      this.logger.log('Closing all MongoDB connections...');
      let closed = 0;
      for (const { connection } of this.tenantCache.values()) {
         try {
            closed++;
            await connection.close();
         } catch (err) {
            this.logger.warn('Error force-closing tenant connection', err);
         }
      }
      this.tenantCache.clear();
      this.logger.debug(`Closed ${closed} connection(s).`);
   }

   async pruneConnections(): Promise<void> {
      this.logger.log('Pruning idle connections connections...');

      let pruned = 0;
      const now = Date.now();
      for (const [cacheKey, mutex] of this.tenantLocks) {
         await mutex.runExclusive(async () => {
            const tenantConnection = this.tenantCache.get(cacheKey);
            if (tenantConnection && now - tenantConnection.lastUsed > TENANT_TTL_MS) {
               try {
                  pruned++;
                  await tenantConnection.connection.close();
                  this.tenantCache.delete(cacheKey);
               } catch (error) {
                  this.logger.warn('Error cleaning up connection.', error);
               }
            }
         });
      }

      this.logger.debug(`Pruned ${pruned} connection(s).`);
   }
}
