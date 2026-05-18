import { Role } from './role.model';
import { RoleManager } from './role.manager';
import { RoleControllerBase } from './role.controller.base';

//NOTE: Codegen will create, but not alter this file.

export class RoleController extends RoleControllerBase  {
   constructor(manager: RoleManager) {
      super(manager);
   }
   // Custom Endpoints here
}