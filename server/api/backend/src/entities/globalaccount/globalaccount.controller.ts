import { GlobalAccount } from './globalaccount.model';
import { GlobalAccountManager } from './globalaccount.manager';
import { GlobalAccountControllerBase } from './globalaccount.controller.base';

//NOTE: Codegen will create, but not alter this file.

export class GlobalAccountController extends GlobalAccountControllerBase  {
   constructor(manager: GlobalAccountManager) {
      super(manager);
   }
   // Custom Endpoints here
}