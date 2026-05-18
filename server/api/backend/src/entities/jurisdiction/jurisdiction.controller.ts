import { Jurisdiction } from './jurisdiction.model';
import { JurisdictionManager } from './jurisdiction.manager';
import { JurisdictionControllerBase } from './jurisdiction.controller.base';

//NOTE: Codegen will create, but not alter this file.

export class JurisdictionController extends JurisdictionControllerBase  {
   constructor(manager: JurisdictionManager) {
      super(manager);
   }
   // Custom Endpoints here
}