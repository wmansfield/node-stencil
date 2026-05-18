import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EntityRegistry } from 'src/entities/entity.registry';
import { CloudStorageHandler, ImageResizeService } from 'src/features/platform/storage';
import { AssetKind } from 'src/entities/enums/assetkind';
import { MAX_INT_32 } from 'src/shared/constants/int';

/**
 * Task service for processing image resize queue.
 * Handles assets where resize_required=true after initial processing failed.
 */
@Injectable()
export class ImageResizeTaskService implements OnApplicationShutdown {
   private readonly logger = new Logger(ImageResizeTaskService.name);
   private isShuttingDown: boolean = false;
   private isRunning: boolean = false;

   private readonly MAX_ATTEMPTS = 3;
   private readonly COOLDOWN_MINUTES = 5;
   private readonly BATCH_SIZE = 20;

   constructor(
      private readonly entities: EntityRegistry,
      private readonly cloudStorageHandler: CloudStorageHandler,
      private readonly imageResizeService: ImageResizeService
   ) {}

   async onApplicationShutdown(signal?: string): Promise<void> {
      this.logger.log(`Shutdown signal received: ${signal || 'unknown'}`);
      this.isShuttingDown = true;
   }

   /**
    * Manual trigger for processing image resize queue.
    */
   async triggerProcess(): Promise<{ processed: number; succeeded: number; failed: number }> {
      if (this.isRunning) {
         this.logger.log('Manual process skipped, already running');
         return { processed: 0, succeeded: 0, failed: 0 };
      }
      this.logger.log('Manual image resize process triggered');
      return await this.processResizeQueue();
   }

   /**
    * Scheduled resize processing - runs every 60 seconds.
    */
   @Interval(60 * 1000)
   async processResizeScheduled(): Promise<void> {
      await this.processResizeQueue();
   }

   /**
    * Process the resize queue across all jurisdictions.
    */
   private async processResizeQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      try {
         this.isRunning = true;

         if (this.isShuttingDown) {
            this.logger.warn('Image Resize: Skipped due to shutdown in progress');
            return { processed, succeeded, failed };
         }

         this.logger.log('Image Resize: Started');

         // Process across all jurisdictions
         const jurisdictions = await this.entities.jurisdictionManager.find(0, MAX_INT_32);

         for (const jurisdiction of jurisdictions.items) {
            if (this.isShuttingDown) {
               this.logger.warn('Image Resize: Interrupted due to shutdown');
               break;
            }

            const result = await this.processJurisdiction(jurisdiction._id);
            processed += result.processed;
            succeeded += result.succeeded;
            failed += result.failed;
         }

         this.logger.log(`Image Resize: Complete - processed: ${processed}, succeeded: ${succeeded}, failed: ${failed}`);
      } catch (error) {
         this.logger.error('Image Resize Error', error);
      } finally {
         this.isRunning = false;
      }

      return { processed, succeeded, failed };
   }

   /**
    * Process resize queue for a single jurisdiction.
    */
   private async processJurisdiction(jurisdiction_id: string): Promise<{ processed: number; succeeded: number; failed: number }> {
      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      const assets = await this.entities.jurisdictionAssetManager.findAssetsNeedingResize(
         jurisdiction_id,
         this.BATCH_SIZE,
         this.MAX_ATTEMPTS,
         this.COOLDOWN_MINUTES
      );

      if (assets.length === 0) {
         return { processed, succeeded, failed };
      }

      this.logger.debug(`Processing ${assets.length} assets in jurisdiction ${jurisdiction_id}`);

      for (const asset of assets) {
         if (this.isShuttingDown) break;

         processed++;
         const processInfo = asset.asProcessPerspective();

         // Mark attempt
         processInfo.resize_attempt_utc = new Date();
         processInfo.resize_attempts = (processInfo.resize_attempts ?? 0) + 1;

         try {
            // Determine resize config based on asset kind
            const resizeConfig = this.getResizeConfig(asset.asset_kind);

            if (!resizeConfig) {
               // No resize needed for this asset kind
               processInfo.resize_required = false;
               processInfo.resize_status = 'not_applicable';
               await this.entities.jurisdictionAssetManager.updateProcessPerspective(processInfo);
               succeeded++;
               continue;
            }

            // Attempt resize
            const result = await this.imageResizeService.processStoredImage(jurisdiction_id, asset.storage_key, resizeConfig);

            if (result.success) {
               // Make thumbnails public for avatars
               if (asset.asset_kind === AssetKind.avatar) {
                  if (result.thumbSmallKey) {
                     await this.cloudStorageHandler.makeFilePublic(jurisdiction_id, result.thumbSmallKey);
                  }
                  if (result.thumbLargeKey) {
                     await this.cloudStorageHandler.makeFilePublic(jurisdiction_id, result.thumbLargeKey);
                  }
               }

               processInfo.resize_required = false;
               processInfo.resize_status = 'success';
               processInfo.thumb_small_key = result.thumbSmallKey;
               processInfo.thumb_large_key = result.thumbLargeKey;
               processInfo.resize_log = undefined;

               this.logger.debug(`Resize succeeded for asset ${asset._id}`);
               succeeded++;
            } else {
               // Resize failed
               processInfo.resize_status = 'failed';
               processInfo.resize_log = result.error?.substring(0, 500);

               this.logger.warn(`Resize failed for asset ${asset._id}: ${result.error}`);
               failed++;

               // If max attempts reached, mark as permanently failed
               if (processInfo.resize_attempts >= this.MAX_ATTEMPTS) {
                  processInfo.resize_status = 'max_attempts_reached';
                  processInfo.resize_required = false; // Stop retrying
                  this.logger.warn(`Asset ${asset._id} reached max resize attempts, giving up`);
               }
            }
         } catch (error: any) {
            processInfo.resize_status = 'error';
            processInfo.resize_log = error?.message?.substring(0, 500) ?? 'Unknown error';
            this.logger.error(`Resize error for asset ${asset._id}`, error);
            failed++;
         }

         await this.entities.jurisdictionAssetManager.updateProcessPerspective(processInfo);
      }

      return { processed, succeeded, failed };
   }

   /**
    * Get resize configuration based on asset kind.
    */
   private getResizeConfig(assetKind: AssetKind): { timeoutMs: number; small?: any; large?: any } | null {
      switch (assetKind) {
      case AssetKind.avatar:
         return {
            timeoutMs: 30000,
            small: { width: 128, height: 128, fit: 'cover', format: 'webp', quality: 80 },
            large: { width: 512, height: 512, fit: 'cover', format: 'webp', quality: 85 },
         };
      case AssetKind.image:
         return {
            timeoutMs: 30000,
            large: { width: 1024, height: 1024, fit: 'inside', format: 'webp', quality: 85 },
         };
      case AssetKind.audio:
         // Audio doesn't need resizing
         return null;
      default:
         return null;
      }
   }
}
