import { Logger } from '@nestjs/common';
import { EntityRegistry } from 'src/entities/entity.registry';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';

const QE_COLLECTIONS = [
   'Message',
   'ConnectionRequest',
   'Invitation',
   'Circle',
   'Audience',
];

const QE_META_SUFFIXES = ['.esc', '.ecoc', '.ecocCompact'];

export async function upgradeTo_v2025_04_28(
   logger: Logger,
   entities: EntityRegistry,
   connectionProvider: MongoConnectionProvider,
   jurisdiction_id: string,
): Promise<void> {
   logger.log(`[v2025_04_28] Starting QE collection migration for jurisdiction: ${jurisdiction_id}`);

   const connection = await connectionProvider.getTenantConnection(jurisdiction_id);
   const db = connection.db!;

   const dumpedData = new Map<string, any[]>();

   for (const collectionName of QE_COLLECTIONS) {
      try {
         const existing = await db.listCollections({ name: collectionName }).toArray();
         if (existing.length === 0) {
            logger.debug(`[v2025_04_28] Collection ${collectionName} does not exist in ${jurisdiction_id}, skipping dump`);
            continue;
         }

         const rawCollection = db.collection(collectionName);
         const docs = await rawCollection.find({}).toArray();
         dumpedData.set(collectionName, docs);
         logger.log(`[v2025_04_28] Dumped ${docs.length} documents from ${collectionName} in ${jurisdiction_id}`);
      } catch (error) {
         logger.error(`[v2025_04_28] Error dumping ${collectionName} in ${jurisdiction_id}: ${error?.message}`);
      }
   }

   for (const collectionName of QE_COLLECTIONS) {
      try {
         const existing = await db.listCollections({ name: collectionName }).toArray();
         if (existing.length > 0) {
            await db.dropCollection(collectionName);
            logger.debug(`[v2025_04_28] Dropped ${collectionName} in ${jurisdiction_id}`);
         }
      } catch (error) {
         logger.warn(`[v2025_04_28] Error dropping ${collectionName} in ${jurisdiction_id}: ${error?.message}`);
      }

      for (const suffix of QE_META_SUFFIXES) {
         const metaName = `enxcol_.${collectionName}${suffix}`;
         try {
            const existing = await db.listCollections({ name: metaName }).toArray();
            if (existing.length > 0) {
               await db.dropCollection(metaName);
               logger.debug(`[v2025_04_28] Dropped ${metaName} in ${jurisdiction_id}`);
            }
         } catch (error) {
            logger.warn(`[v2025_04_28] Error dropping ${metaName} in ${jurisdiction_id}: ${error?.message}`);
         }
      }
   }

   await connectionProvider.evictConnection(jurisdiction_id);
   logger.log(`[v2025_04_28] Evicted connection for ${jurisdiction_id}, reconnecting with QE config`);

   const freshConnection = await connectionProvider.getTenantConnection(jurisdiction_id);
   const freshDb = freshConnection.db!;

   for (const collectionName of QE_COLLECTIONS) {
      const docs = dumpedData.get(collectionName);
      if (!docs || docs.length === 0) {
         continue;
      }

      let succeeded = 0;
      let failed = 0;

      const freshCollection = freshDb.collection(collectionName);

      for (const doc of docs) {
         try {
            delete doc.__safeContent__;
            await freshCollection.insertOne(doc);
            succeeded++;
         } catch (error) {
            failed++;
            if (failed <= 3) {
               logger.warn(`[v2025_04_28] Failed to re-insert document in ${collectionName}: ${error?.message}`);
            }
         }
      }

      logger.log(`[v2025_04_28] ${collectionName} in ${jurisdiction_id}: ${succeeded} migrated, ${failed} failed`);
   }

   logger.log(`[v2025_04_28] QE collection migration complete for jurisdiction: ${jurisdiction_id}`);
}
