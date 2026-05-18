import { Injectable, Logger } from '@nestjs/common';
import { Connection, ConnectOptions, createConnection } from 'mongoose';
import { Mutex } from 'async-mutex';
import { getAllSchemas } from 'src/shared/managers/schema-registry';

interface ConnectionInfo {
   connection: Connection;
   lastUsed: number;
}

/**
 * Test replacement for MongoConnectionProvider.
 *
 * Connects to a mongodb-memory-server instance. Skips all encryption
 * (queryable encryption requires a real KMS, which we don't need for
 * data-correctness tests).
 *
 * The URI is injected via `setUri()` before the NestJS app starts.
 */
@Injectable()
export class TestMongoConnectionProvider {
   private readonly logger = new Logger(TestMongoConnectionProvider.name);
   private uri: string;
   private tenantCache = new Map<string, ConnectionInfo>();
   private tenantLocks = new Map<string, Mutex>();

   setUri(uri: string) {
      this.uri = uri;
   }

   async getTenantConnection(tenant_code: string): Promise<Connection> {
      const key = tenant_code;
      if (!this.tenantLocks.has(key)) {
         this.tenantLocks.set(key, new Mutex());
      }

      const mutex = this.tenantLocks.get(key)!;
      return await mutex.runExclusive(async () => {
         let cached = this.tenantCache.get(key);
         if (!cached) {
            const conn = await this.createConnection(tenant_code);
            cached = { connection: conn, lastUsed: Date.now() };
            this.tenantCache.set(key, cached);
         }
         cached.lastUsed = Date.now();
         return cached.connection;
      });
   }

   private async createConnection(tenant_code: string): Promise<Connection> {
      this.logger.log(`[Test] Creating connection for tenant "${tenant_code}"`);

      // Each tenant gets its own database name on the same memory server
      const dbName = `test_${tenant_code}`;

      const options: ConnectOptions = {
         bufferCommands: false,
         dbName,
         maxPoolSize: 5,
         minPoolSize: 1,
      };

      const conn = await createConnection(this.uri, options).asPromise();

      // Register all schemas (same as production, minus encryption)
      const collectionDefinitions = getAllSchemas();
      for (const definition of collectionDefinitions) {
         conn.model(definition.name, definition.schema, definition.name);
      }

      return conn;
   }

   async closeConnections(): Promise<void> {
      for (const { connection } of this.tenantCache.values()) {
         try {
            await connection.close();
         } catch {
            // ignore errors during test teardown
         }
      }
      this.tenantCache.clear();
   }

   async pruneConnections(): Promise<void> {
      // no-op in tests
   }
}
