import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import {
   assertString,
   assertStringArray,
   assertBoolean,
   assertNumber,
   assertUuid,
   assertDate,
   assertEnum,
   assertEnumArray,
   assertNested,
   assertNestedArray,
   assertPlainObject,
   optional,
} from 'src/shared/utils/sanitized.validators';



export interface IWidgetReadRequest {
	widget_id: string;
   language_code?: string;
   
}

/** Registry key for Sanitize.for(WidgetReadRequest). Use @Body(Sanitize.for(WidgetReadRequest)) input: IWidgetReadRequest. */
export class WidgetReadRequest {}

const widgetreadrequestValidators: SanitizedValidatorMap = {
widget_id: (v) => assertUuid(v, 'widget_id'),
language_code: (v) => optional(assertString)(v, 'language_code'),

};

registerSanitizedValidators(WidgetReadRequest, widgetreadrequestValidators);