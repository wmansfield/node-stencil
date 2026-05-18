import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { COLLECTION_NAME, PreSignedUrl } from './presignedurl.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({})
export class PreSignedUrlModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: PreSignedUrl.PreSignedUrlSchema,
      });
   }
}