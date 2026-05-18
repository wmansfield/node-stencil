import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { JurisdictionSettingController } from './jurisdictionsetting.controller';
import { JurisdictionSettingManager } from './jurisdictionsetting.manager';
import { COLLECTION_NAME, JurisdictionSetting } from './jurisdictionsetting.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule)],
   controllers: [JurisdictionSettingController],
   providers: [
      JurisdictionSettingManager,
      {
         provide: 'JurisdictionSettingManager', // For dynamic resolution
         useClass: JurisdictionSettingManager,
      },
   ],
   exports: [
      JurisdictionSettingManager,
      {
         provide: 'JurisdictionSettingManager', // For dynamic resolution
         useClass: JurisdictionSettingManager,
      },
   ]
})
export class JurisdictionSettingModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: JurisdictionSetting.JurisdictionSettingSchema,
      });
   }
}