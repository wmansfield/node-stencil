import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { COLLECTION_NAME, IDPair } from './idpair.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({})
export class IDPairModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: IDPair.IDPairSchema,
      });
   }
}