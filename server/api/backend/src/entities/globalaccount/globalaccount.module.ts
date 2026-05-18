import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { GlobalAccountController } from './globalaccount.controller';
import { GlobalAccountManager } from './globalaccount.manager';
import { COLLECTION_NAME, GlobalAccount } from './globalaccount.schema';
import { EntitiesModule } from 'src/entities/entity.module';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule)],
   controllers: [GlobalAccountController],
   providers: [
      GlobalAccountManager,
      {
         provide: 'GlobalAccountManager', // For dynamic resolution
         useClass: GlobalAccountManager,
      },
   ],
   exports: [
      GlobalAccountManager,
      {
         provide: 'GlobalAccountManager', // For dynamic resolution
         useClass: GlobalAccountManager,
      },
   ]
})
export class GlobalAccountModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: GlobalAccount.GlobalAccountSchema,
      });
   }
}