import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { JurisdictionAssetController } from './jurisdictionasset.controller';
import { JurisdictionAssetManager } from './jurisdictionasset.manager';
import { COLLECTION_NAME, JurisdictionAsset } from './jurisdictionasset.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule)],
   controllers: [JurisdictionAssetController],
   providers: [
      JurisdictionAssetManager,
      {
         provide: 'JurisdictionAssetManager', // For dynamic resolution
         useClass: JurisdictionAssetManager,
      },
   ],
   exports: [
      JurisdictionAssetManager,
      {
         provide: 'JurisdictionAssetManager', // For dynamic resolution
         useClass: JurisdictionAssetManager,
      },
   ]
})
export class JurisdictionAssetModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: JurisdictionAsset.JurisdictionAssetSchema,
      });
   }
}