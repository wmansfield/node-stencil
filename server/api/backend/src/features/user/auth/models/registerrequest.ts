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



export interface IRegisterRequest {
	jurisdiction: string;
   auth_token: string;
   display_name: string;
   
}

/** Registry key for Sanitize.for(RegisterRequest). Use @Body(Sanitize.for(RegisterRequest)) input: IRegisterRequest. */
export class RegisterRequest {}

const registerrequestValidators: SanitizedValidatorMap = {
jurisdiction: (v) => assertString(v, 'jurisdiction'),
auth_token: (v) => assertString(v, 'auth_token'),
display_name: (v) => assertString(v, 'display_name'),

};

registerSanitizedValidators(RegisterRequest, registerrequestValidators);