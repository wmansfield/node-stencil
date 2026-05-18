import { Widget } from './widget.model';
import { WidgetManager } from './widget.manager';
import { WidgetControllerBase } from './widget.controller.base';
import { CloudStorageHandler } from 'src/features/platform/storage';

//NOTE: Codegen will create, but not alter this file.

export class WidgetController extends WidgetControllerBase  {
   constructor(manager: WidgetManager, cloudStorageHandler: CloudStorageHandler) {
      super(manager, cloudStorageHandler);
   }
   // Custom Endpoints here
}