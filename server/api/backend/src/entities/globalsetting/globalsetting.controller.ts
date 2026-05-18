import { Controller, Get } from '@nestjs/common';
import { GlobalSetting } from './globalsetting.model';
import { GlobalSettingManager } from './globalsetting.manager';
import { GlobalSettingControllerBase } from './globalsetting.controller.base';

export class GlobalSettingController extends GlobalSettingControllerBase {
   constructor(manager: GlobalSettingManager) {
      super(manager);
   }
   // Custom Endpoints here
}
