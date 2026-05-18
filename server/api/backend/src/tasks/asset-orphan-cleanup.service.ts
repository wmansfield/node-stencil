import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EntityRegistry } from 'src/entities/entity.registry';
import { CloudStorageHandler } from 'src/features/platform/storage';
import { MAX_INT_32 } from 'src/shared/constants/int';

const STALE_THRESHOLD_HOURS = 24;
const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const BATCH_SIZE = 100;

@Injectable()
export class AssetOrphanCleanupService implements OnApplicationShutdown {
   private readonly logger = new Logger(AssetOrphanCleanupService.name);
   private isShuttingDown = false;
   private isRunning = false;

   constructor(
      private readonly entities: EntityRegistry,
      private readonly cloudStorageHandler: CloudStorageHandler
   ) {}

   async onApplicationShutdown(): Promise<void> {
      this.isShuttingDown = true;
   }

   async triggerCleanup(): Promise<{ deleted: number }> {
      if (this.isRunning) {
         this.logger.log('Orphan cleanup skipped, already running');
         return { deleted: 0 };
      }
      return await this.runCleanup();
   }

   @Interval(INTERVAL_MS)
   async scheduledCleanup(): Promise<void> {
      await this.runCleanup();
   }

   private async runCleanup(): Promise<{ deleted: number }> {
      let deleted = 0;

      try {
         this.isRunning = true;

         if (this.isShuttingDown) {
            return { deleted };
         }

         this.logger.log('Asset Orphan Cleanup: Started');

         const jurisdictions = await this.entities.jurisdictionManager.find(0, MAX_INT_32);

         for (const jurisdiction of jurisdictions.items) {
            if (this.isShuttingDown) break;
            deleted += await this.cleanJurisdiction(jurisdiction._id);
         }

         this.logger.log(`Asset Orphan Cleanup: Complete - deleted ${deleted} orphan assets`);
      } catch (error) {
         this.logger.error('Asset Orphan Cleanup Error', error);
      } finally {
         this.isRunning = false;
      }

      return { deleted };
   }

   /**
    * Deletes assets that were prepared but never completed (available=false)
    * and are older than the stale threshold.
    */
   private async cleanJurisdiction(jurisdiction_id: string): Promise<number> {
      let deleted = 0;
      const cutoff = new Date(Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);

      try {
         const staleAssets = await this.entities.jurisdictionAssetManager.findStaleOrphans(
            jurisdiction_id,
            cutoff,
            BATCH_SIZE
         );

         for (const asset of staleAssets) {
            if (this.isShuttingDown) break;

            try {
               if (asset.storage_key) {
                  await this.cloudStorageHandler.deleteFile(jurisdiction_id, asset.storage_key);
               }
               await this.entities.jurisdictionAssetManager.delete(asset);
               deleted++;
            } catch (error) {
               this.logger.warn(`Failed to delete orphan asset ${asset._id}: ${error.message}`);
            }
         }
      } catch (error) {
         this.logger.warn(`Failed to clean jurisdiction ${jurisdiction_id}: ${error.message}`);
      }

      return deleted;
   }
}
