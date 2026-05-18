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



export interface INameRequest {
	display_name: string;
   
}

/** Registry key for Sanitize.for(NameRequest). Use @Body(Sanitize.for(NameRequest)) input: INameRequest. */
export class NameRequest {}

const namerequestValidators: SanitizedValidatorMap = {
display_name: (v) => assertString(v, 'display_name'),

};

registerSanitizedValidators(NameRequest, namerequestValidators);