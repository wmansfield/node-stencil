import { DynamicModule, Module } from '@nestjs/common';
import { MongoPrunerService } from './mongo-pruner.service';
import { CacheCleanupService } from './cache-cleanup.service';
import { TasksController } from './tasks.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { MongoModule } from 'src/shared/mongo';
import { AppConfigModule } from 'src/config/config.module';
import { EntityRegistryModule } from 'src/entities/entity-registry.module';
import { MongoIndexService } from './mongo-index.service';
import { StorageModule } from 'src/features/platform/storage';
import { EntitySynchronizerService } from './entity-synchronizer.service';
import { ImageResizeTaskService } from './image-resize.service';
import { RoleSyncService } from './role-sync.service';
import { AssetOrphanCleanupService } from './asset-orphan-cleanup.service';
import { JurisdictionSchemaService } from './jurisdiction-schema/jurisdiction-schema.service';

@Module({})
export class TasksModule {
   static forRoot(): DynamicModule {
      const enableScheduler = process.env.SCHEDULER_ENABLED === 'true';

      console.log(`[TasksModule] Scheduler enabled: ${enableScheduler}`);

      const imports: any[] = [MongoModule, AppConfigModule, EntityRegistryModule, StorageModule];

      if (enableScheduler) {
         imports.push(ScheduleModule.forRoot());
         console.log('[TasksModule] ScheduleModule loaded - scheduled tasks will run');
      } else {
         console.log('[TasksModule] ScheduleModule NOT loaded - scheduled tasks will NOT run');
      }

      return {
         module: TasksModule,
         imports,
         controllers: [TasksController],
         providers: [
            CacheCleanupService,
            MongoIndexService,
            MongoPrunerService,
            EntitySynchronizerService,
            ImageResizeTaskService,
            RoleSyncService,
            AssetOrphanCleanupService,
            JurisdictionSchemaService,
         ],
      };
   }
}
