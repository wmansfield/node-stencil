import { Controller, Get } from '@nestjs/common';
import { Timezone } from './timezone.model';
import { TimezoneManager } from './timezone.manager';
import { TimezoneControllerBase } from './timezone.controller.base';

export class TimezoneController extends TimezoneControllerBase {
   constructor(manager: TimezoneManager) {
      super(manager);
   }
   // Custom Endpoints here
}
