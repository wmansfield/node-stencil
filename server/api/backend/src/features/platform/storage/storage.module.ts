import { Module } from '@nestjs/common';
import { AppConfigModule } from 'src/config/config.module';
import { CloudStorageHandler } from './handlers/cloud-storage.handler';
import { ImageResizeService } from './services/image-resize.service';

@Module({
   imports: [AppConfigModule],
   providers: [CloudStorageHandler, ImageResizeService],
   exports: [CloudStorageHandler, ImageResizeService],
})
export class StorageModule {}
