import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { COLLECTION_NAME, ContentSection } from './contentsection.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({})
export class ContentSectionModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: ContentSection.ContentSectionSchema,
      });
   }
}