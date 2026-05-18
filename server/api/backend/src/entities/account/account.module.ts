import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { AccountController } from './account.controller';
import { AccountManager } from './account.manager';
import { COLLECTION_NAME, Account } from './account.schema';
import { EntitiesModule } from 'src/entities/entity.module';
import { StorageModule } from 'src/features/platform/storage';

@Module({
   imports: [MongoModule, forwardRef(() => EntitiesModule), StorageModule],
   controllers: [AccountController],
   providers: [
      AccountManager,
      {
         provide: 'AccountManager', // For dynamic resolution
         useClass: AccountManager,
      },
   ],
   exports: [
      AccountManager,
      {
         provide: 'AccountManager', // For dynamic resolution
         useClass: AccountManager,
      },
   ]
})
export class AccountModule {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: Account.AccountSchema,
      });
   }
}