import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EntityRegistry } from 'src/entities/entity.registry';
import { MAX_INT_32 } from 'src/shared/constants/int';
import { IMongoManagerIndexable, IMongoManagerIndexableIsolated } from 'src/shared/managers/mongo-manager-indexable';

@Injectable()
export class MongoIndexService {
   private readonly logger = new Logger(MongoIndexService.name);

   constructor(private readonly entities: EntityRegistry) {}

   @Interval(15 * 60 * 1000) // Run every 15 minutes
   async ensureIndexes() {
      await this.performProcess();
   }

   async triggerProcess() {
      this.logger.log('Manual process triggered');
      return await this.performProcess();
   }

   private async performProcess() {
      try {
         this.logger.log('Starting Index sync...');

         // get managers
         const managers = this.getManagers();
         const sharedManagers: [string, IMongoManagerIndexable][] = [];
         const isolatedManagers: [string, IMongoManagerIndexableIsolated][] = []; //NOT YET SUPPORTED

         // split by tenant kind
         for (const [managerName, manager] of managers) {
            try {
               if (manager) {
                  if (this.isIsolatedManager(manager)) {
                     isolatedManagers.push([managerName, manager]);
                  } else {
                     sharedManagers.push([managerName, manager]);
                  }
               }
            } catch (error) {
               this.logger.error(`Error ensuring indexes for ${managerName}:`, error);
            }
         }

         // process shared
         for (const [managerName, manager] of sharedManagers) {
            try {
               await manager.ensureIndexes();
            } catch (error) {
               this.logger.error(`Error ensuring indexes for ${managerName}:`, error);
            }
         }

         // process jurisdiction
         const jurisdictions = await this.entities.jurisdictionManager.find(0, MAX_INT_32);
         for (const jurisdiction of jurisdictions?.items) {
            for (const [managerName, manager] of isolatedManagers) {
               try {
                  await manager.ensureIndexes(jurisdiction._id);
               } catch (error) {
                  this.logger.error(`Error ensuring indexes for ${managerName}:`, error);
               }
            }
         }

         const result = {
            success: true,
         };

         this.logger.log('Index sync completed.');
         return result;
      } catch (error) {
         this.logger.error('Error during Index sync:', error);
         return { success: false, error: error.message };
      }
   }

   private getManagers(): [string, IMongoManagerIndexable][] {
      const managers: [string, IMongoManagerIndexable][] = [];

      // Get all properties that end with 'Manager' from the entities registry
      const entityKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(this.entities)).filter(
         key => key.endsWith('Manager') && key !== 'constructor'
      );

      for (const key of entityKeys) {
         try {
            const manager = (this.entities as any)[key] as IMongoManagerIndexable;
            if (manager) {
               managers.push([key, manager]);
            }
         } catch (error) {
            this.logger.warn(`Could not access manager ${key}:`, error);
         }
      }

      return managers;
   }

   private isIsolatedManager(manager: IMongoManagerIndexable | IMongoManagerIndexableIsolated): manager is IMongoManagerIndexableIsolated {
      return manager.ensureIndexes.length === 1;
   }
}
