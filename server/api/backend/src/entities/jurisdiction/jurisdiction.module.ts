import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { JurisdictionController } from './jurisdiction.controller';
import { JurisdictionManager } from './jurisdiction.manager';
import { COLLECTION_NAME, Jurisdiction } from './jurisdiction.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule)],
   controllers: [JurisdictionController],
   providers: [
      JurisdictionManager,
      {
         provide: 'JurisdictionManager', // For dynamic resolution
         useClass: JurisdictionManager,
      },
   ],
   exports: [
      JurisdictionManager,
      {
         provide: 'JurisdictionManager', // For dynamic resolution
         useClass: JurisdictionManager,
      },
   ]
})
export class JurisdictionModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: Jurisdiction.JurisdictionSchema,
      });
   }
}