import { Module } from '@nestjs/common';
import { BootstrapController } from './bootstrap.controller';
import { EntitiesModule } from 'src/entities/entity.module';
import { RoleSyncService } from 'src/tasks/role-sync.service';

@Module({
   imports: [EntitiesModule],
   providers: [RoleSyncService],
   controllers: [BootstrapController],
})
export class BootstrapModule {}
