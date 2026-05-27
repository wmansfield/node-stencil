import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Connection, ConnectOptions, createConnection } from 'mongoose';
import { Mutex } from 'async-mutex';
import { getAllSchemas } from '../managers/schema-registry';

/**
 * Development replacement for MongoConnectionProvider.
 *
 * Starts a single `mongodb-memory-server` instance and routes every tenant
 * into its own database on that server. Queryable encryption is intentionally
 * skipped — the XML `encrypted` attribute has been removed for this template,
 * so no schema metadata requests it.
 *
 * This provider is selected automatically when the SHARED tenant has no Mongo URI
 * (see ConfigResolver.usesInMemoryMongo and MongoModule). It is never used in production.
 *
 * `mongodb-memory-server` is a devDependency and is loaded via dynamic import
 * so that a production bundle that tree-shakes unused code never pulls it in.
 */
@Injectable()
export class DevMongoConnectionProvider implements OnApplicationShutdown {
   private readonly logger = new Logger(DevMongoConnectionProvider.name);

   private mongoServer: import('mongodb-memory-server').MongoMemoryServer | null = null;
   private serverUri: string | null = null;
   private readonly startLock = new Mutex();

   private tenantCache = new Map<string, Connection>();
   private tenantLocks = new Map<string, Mutex>();

   private async getUri(): Promise<string> {
      return this.startLock.runExclusive(async () => {
         if (this.serverUri) {
            return this.serverUri;
         }

         this.logger.debug('Starting mongodb-memory-server...');

         // Dynamic import keeps mongodb-memory-server out of production bundles.
         const { MongoMemoryServer } = await import('mongodb-memory-server');
         this.mongoServer = await MongoMemoryServer.create();
         this.serverUri = this.mongoServer.getUri();
         return this.serverUri;
      });
   }

   async getTenantConnection(tenant_code: string): Promise<Connection> {
      if (!this.tenantLocks.has(tenant_code)) {
         this.tenantLocks.set(tenant_code, new Mutex());
      }

      const mutex = this.tenantLocks.get(tenant_code)!;
      return mutex.runExclusive(async () => {
         const cached = this.tenantCache.get(tenant_code);
         if (cached) {
            return cached;
         }

         const uri = await this.getUri();
         const conn = await this.createConnection(uri, tenant_code);
         this.tenantCache.set(tenant_code, conn);
         return conn;
      });
   }

   private async createConnection(uri: string, tenant_code: string): Promise<Connection> {
      this.logger.log(`[Dev] Creating in-memory connection for tenant "${tenant_code}"`);

      const options: ConnectOptions = {
         bufferCommands: false,
         dbName: `dev_${tenant_code}`,
         maxPoolSize: 5,
         minPoolSize: 1,
      };

      const conn = await createConnection(uri, options).asPromise();

      const collectionDefinitions = getAllSchemas();
      for (const definition of collectionDefinitions) {
         conn.model(definition.name, definition.schema, definition.name);
      }

      return conn;
   }

   async evictConnection(tenant_code: string): Promise<void> {
      const mutex = this.tenantLocks.get(tenant_code);
      if (!mutex) {
         return;
      }

      await mutex.runExclusive(async () => {
         const conn = this.tenantCache.get(tenant_code);
         if (conn) {
            try {
               await conn.close();
            } catch {
               // ignore
            }
            this.tenantCache.delete(tenant_code);
         }
      });
   }

   async closeConnections(): Promise<void> {
      for (const conn of this.tenantCache.values()) {
         try {
            await conn.close();
         } catch {
            // ignore
         }
      }
      this.tenantCache.clear();
   }

   async pruneConnections(): Promise<void> {
      // no-op — memory server connections are cheap and don't need pruning
   }

   async onApplicationShutdown(): Promise<void> {
      await this.closeConnections();
      if (this.mongoServer) {
         await this.mongoServer.stop();
         this.mongoServer = null;
         this.serverUri = null;
      }
   }
}
