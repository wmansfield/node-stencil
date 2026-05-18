import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { WidgetController } from './widget.controller';
import { WidgetManager } from './widget.manager';
import { COLLECTION_NAME, Widget } from './widget.schema';
import { EntitiesModule } from 'src/entities/entity.module';
import { StorageModule } from 'src/features/platform/storage';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule), StorageModule],
   controllers: [WidgetController],
   providers: [
      WidgetManager,
      {
         provide: 'WidgetManager', // For dynamic resolution
         useClass: WidgetManager,
      },
   ],
   exports: [
      WidgetManager,
      {
         provide: 'WidgetManager', // For dynamic resolution
         useClass: WidgetManager,
      },
   ]
})
export class WidgetModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: Widget.WidgetSchema,
      });
   }
}