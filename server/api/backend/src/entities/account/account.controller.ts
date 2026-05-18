import { Account } from './account.model';
import { AccountManager } from './account.manager';
import { AccountControllerBase } from './account.controller.base';
import { CloudStorageHandler } from 'src/features/platform/storage';

//NOTE: Codegen will create, but not alter this file.

export class AccountController extends AccountControllerBase {
   constructor(manager: AccountManager, cloudStorageHandler: CloudStorageHandler) {
      super(manager, cloudStorageHandler);
   }
   // Custom Endpoints here
}
