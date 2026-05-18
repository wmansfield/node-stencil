import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { TimezoneController } from './timezone.controller';
import { TimezoneManager } from './timezone.manager';
import { COLLECTION_NAME, Timezone } from './timezone.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule)],
   controllers: [TimezoneController],
   providers: [
      TimezoneManager,
      {
         provide: 'TimezoneManager', // For dynamic resolution
         useClass: TimezoneManager,
      },
   ],
   exports: [
      TimezoneManager,
      {
         provide: 'TimezoneManager', // For dynamic resolution
         useClass: TimezoneManager,
      },
   ]
})
export class TimezoneModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: Timezone.TimezoneSchema,
      });
   }
}