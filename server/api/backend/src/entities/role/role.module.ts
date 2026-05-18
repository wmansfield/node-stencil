import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { RoleController } from './role.controller';
import { RoleManager } from './role.manager';
import { COLLECTION_NAME, Role } from './role.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule)],
   controllers: [RoleController],
   providers: [
      RoleManager,
      {
         provide: 'RoleManager', // For dynamic resolution
         useClass: RoleManager,
      },
   ],
   exports: [
      RoleManager,
      {
         provide: 'RoleManager', // For dynamic resolution
         useClass: RoleManager,
      },
   ]
})
export class RoleModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: Role.RoleSchema,
      });
   }
}