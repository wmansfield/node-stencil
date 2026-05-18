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



export interface ILanguageRequest {
	language_code: string;
   
}

/** Registry key for Sanitize.for(LanguageRequest). Use @Body(Sanitize.for(LanguageRequest)) input: ILanguageRequest. */
export class LanguageRequest {}

const languagerequestValidators: SanitizedValidatorMap = {
language_code: (v) => assertString(v, 'language_code'),

};

registerSanitizedValidators(LanguageRequest, languagerequestValidators);