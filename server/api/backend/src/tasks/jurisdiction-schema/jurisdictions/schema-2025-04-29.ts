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

export async function upgradeTo_v2025_04_29(
   logger: Logger,
   entities: EntityRegistry,
   connectionProvider: MongoConnectionProvider,
   jurisdiction_id: string,
): Promise<void> {
   logger.log(`[v2025_04_29] Starting QE collection rebuild for jurisdiction: ${jurisdiction_id}`);

   const connection = await connectionProvider.getTenantConnection(jurisdiction_id);
   const db = connection.db!;

   for (const collectionName of QE_COLLECTIONS) {
      try {
         const existing = await db.listCollections({ name: collectionName }).toArray();
         if (existing.length > 0) {
            await db.dropCollection(collectionName);
            logger.debug(`[v2025_04_29] Dropped ${collectionName} in ${jurisdiction_id}`);
         }
      } catch (error) {
         logger.warn(`[v2025_04_29] Error dropping ${collectionName} in ${jurisdiction_id}: ${error?.message}`);
      }

      for (const suffix of QE_META_SUFFIXES) {
         const metaName = `enxcol_.${collectionName}${suffix}`;
         try {
            const existing = await db.listCollections({ name: metaName }).toArray();
            if (existing.length > 0) {
               await db.dropCollection(metaName);
               logger.debug(`[v2025_04_29] Dropped ${metaName} in ${jurisdiction_id}`);
            }
         } catch (error) {
            logger.warn(`[v2025_04_29] Error dropping ${metaName} in ${jurisdiction_id}: ${error?.message}`);
         }
      }
   }

   // Evict so the connection provider recreates collections with correct QE metadata and tenant KMS
   await connectionProvider.evictConnection(jurisdiction_id);
   logger.log(`[v2025_04_29] Evicted connection for ${jurisdiction_id}, will recreate with correct QE config on next access`);

   await connectionProvider.getTenantConnection(jurisdiction_id);
   logger.log(`[v2025_04_29] QE collection rebuild complete for jurisdiction: ${jurisdiction_id}`);
}
