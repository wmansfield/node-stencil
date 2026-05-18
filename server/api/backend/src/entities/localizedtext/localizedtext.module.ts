import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { COLLECTION_NAME, LocalizedText } from './localizedtext.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({})
export class LocalizedTextModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: LocalizedText.LocalizedTextSchema,
      });
   }
}