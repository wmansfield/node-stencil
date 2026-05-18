import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConfigResolver } from 'src/config/config.resolver';
import { EntityRegistry } from 'src/entities/entity.registry';
import { MAX_INT_32 } from 'src/shared/constants/int';

@Injectable()
export class EntitySynchronizerService implements OnApplicationShutdown {
   private readonly logger = new Logger(EntitySynchronizerService.name);
   private agent_name: string = ''; // blank for deafult agents (we currently don't support other agents)
   private isShuttingDown: boolean = false;
   private isRunning: boolean = false; // mild concurrency check for admin invocations

   constructor(
      private readonly configResolver: ConfigResolver,
      private readonly entities: EntityRegistry
   ) {}

   async onApplicationShutdown(signal?: string): Promise<void> {
      this.logger.log(`Shutdown signal received: ${signal || 'unknown'}`);
      this.isShuttingDown = true;
   }

   async triggerProcess() {
      if (this.isRunning) {
         this.logger.log('Manual process skipped, already running');
         return;
      }
      this.logger.log('Manual process triggered');
      return await this.performEntitySync();
   }

   @Interval(1 * 30 * 1000) // Run every 30 seconds
   async syncEntities() {
      await this.performEntitySync();
   }

   async invalidateEverything(): Promise<void> {
      try {
         this.isRunning = true;

         if (this.isShuttingDown) {
            this.logger.warn('Entity Invalidation: Skipped due to shutdown in progress');
            return;
         }
         this.logger.log('Entity Invalidation: Started');

         const sharedSynchronizers = this.entities.getSharedSynchronizers();
         for (const synchronizer of sharedSynchronizers) {
            if (this.isShuttingDown) {
               this.logger.warn('Entity Invalidation: Interrupted due to shutdown');
               return;
            }
            await synchronizer.invalidateAll(this.agent_name);
            this.logger.debug(`${synchronizer.collectionName} Invalidated`);
         }

         const isolatedSynchronizers = this.entities.getIsolatedSynchronizers();

         const jurisdictions = await this.entities.jurisdictionManager.find(0, MAX_INT_32);
         for (const jurisdiction of jurisdictions.items) {
            for (const synchronizer of isolatedSynchronizers) {
               if (this.isShuttingDown) {
                  this.logger.warn('Entity Invalidation: Interrupted due to shutdown');
                  return;
               }
               await synchronizer.invalidateAll(jurisdiction._id, this.agent_name);
               this.logger.debug(`${synchronizer.collectionName} Invalidated`);
            }
         }

         this.logger.log('Entity Invalidation: Complete');
      } catch (error) {
         this.logger.error('Entity Invalidation Error', error);
      } finally {
         this.isRunning = false;
      }
   }

   private async performEntitySync(): Promise<void> {
      try {
         this.isRunning = true;

         if (this.isShuttingDown) {
            this.logger.warn('Entity Sync: Skipped due to shutdown in progress');
            return;
         }
         this.logger.log('Entity Sync: Started');

         const sharedSynchronizers = this.entities.getSharedSynchronizers();
         for (const synchronizer of sharedSynchronizers) {
            if (this.isShuttingDown) {
               this.logger.warn('Entity Sync: Interrupted due to shutdown');
               return;
            }
            const processed = await synchronizer.synchronizeDirtyItems(this.agent_name, () => this.isShuttingDown);
            this.logger.debug(`${synchronizer.collectionName} Synchronized: ${processed}.`);
         }

         const isolatedSynchronizers = this.entities.getIsolatedSynchronizers();

         const jurisdictions = await this.entities.jurisdictionManager.find(0, MAX_INT_32);
         for (const jurisdiction of jurisdictions.items) {
            for (const synchronizer of isolatedSynchronizers) {
               if (this.isShuttingDown) {
                  this.logger.warn('Entity Sync: Interrupted due to shutdown');
                  return;
               }
               const processed = await synchronizer.synchronizeDirtyItems(jurisdiction._id, this.agent_name, () => this.isShuttingDown);
               this.logger.debug(`${synchronizer.collectionName} Synchronized: ${processed}.`);
            }
         }

         this.logger.log('Entity Sync: Complete');
      } catch (error) {
         this.logger.error('Entity Sync Error', error);
      } finally {
         this.isRunning = false;
      }
   }
}
