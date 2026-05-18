import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { COLLECTION_NAME, MediaInfo } from './mediainfo.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({})
export class MediaInfoModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: MediaInfo.MediaInfoSchema,
      });
   }
}