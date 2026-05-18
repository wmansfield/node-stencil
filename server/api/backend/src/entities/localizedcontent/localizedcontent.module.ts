import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { COLLECTION_NAME, LocalizedContent } from './localizedcontent.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({})
export class LocalizedContentModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: LocalizedContent.LocalizedContentSchema,
      });
   }
}