import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { GlobalSettingController } from './globalsetting.controller';
import { GlobalSettingManager } from './globalsetting.manager';
import { COLLECTION_NAME, GlobalSetting } from './globalsetting.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule)],
   controllers: [GlobalSettingController],
   providers: [
      GlobalSettingManager,
      {
         provide: 'GlobalSettingManager', // For dynamic resolution
         useClass: GlobalSettingManager,
      },
   ],
   exports: [
      GlobalSettingManager,
      {
         provide: 'GlobalSettingManager', // For dynamic resolution
         useClass: GlobalSettingManager,
      },
   ]
})
export class GlobalSettingModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: GlobalSetting.GlobalSettingSchema,
      });
   }
}