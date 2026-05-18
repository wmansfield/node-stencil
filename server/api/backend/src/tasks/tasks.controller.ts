import { Controller, Post, UseGuards } from '@nestjs/common';
import { AppPermissions } from 'src/shared/constants/permissions';
import { AuthGuard, Permission } from 'src/shared/access-control/auth.guard';
import { MongoIndexService } from './mongo-index.service';
import { EntitySynchronizerService } from './entity-synchronizer.service';
import { ImageResizeTaskService } from './image-resize.service';
import { RoleSyncService } from './role-sync.service';
import { JurisdictionSchemaService } from './jurisdiction-schema/jurisdiction-schema.service';

@Controller('platform/tasks')
@UseGuards(AuthGuard)
export class TasksController {
   constructor(
      private readonly mongoIndexService: MongoIndexService,
      private readonly entitySynchronizerService: EntitySynchronizerService,
      private readonly imageResizeTaskService: ImageResizeTaskService,
      private readonly roleSyncService: RoleSyncService,
      private readonly jurisdictionSchemaService: JurisdictionSchemaService,
   ) {}

   @Post('indexer')
   @Permission(AppPermissions.Tasks.Index.Sync)
   async triggerIndexSync() {
      await this.mongoIndexService.triggerProcess();
      return { success: true };
   }

   @Post('invalidateall')
   @Permission(AppPermissions.Tasks.Synchronization.Sync)
   async triggerInvalidateall() {
      await this.entitySynchronizerService.invalidateEverything();
      return { success: true };
   }

   @Post('synchronization')
   @Permission(AppPermissions.Tasks.Synchronization.Sync)
   async triggerSynchronization() {
      await this.entitySynchronizerService.triggerProcess();
      return { success: true };
   }


   @Post('image-resize')
   @Permission(AppPermissions.Tasks.ImageResize.Sync)
   async triggerImageResize() {
      const result = await this.imageResizeTaskService.triggerProcess();
      return { success: true, ...result };
   }

   @Post('role-sync')
   @Permission(AppPermissions.Tasks.RoleSync.Sync)
   async triggerRoleSync() {
      const result = await this.roleSyncService.triggerSync();
      return { success: true, ...result };
   }


   @Post('schema')
   @Permission(AppPermissions.Tasks.Schema.Sync)
   async triggerSchemaUpgrade() {
      const result = await this.jurisdictionSchemaService.triggerProcess();
      return result;
   }
}
