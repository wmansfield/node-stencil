import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { LocalizedText } from './localizedtext.model';
import {
   assertString,
   assertStringArray,
   assertBoolean,
   assertNumber,
   assertUuid,
   assertDate,
   assertEnum,
   assertEnumArray,
   assertPlainObject,
   assertNested,
   assertNestedArray,
   optional,
} from 'src/shared/utils/sanitized.validators';


const localizedtextValidators: SanitizedValidatorMap = {
language_code: (v) => optional(assertString)(v, 'language_code'),
text: (v) => optional(assertString)(v, 'text'),
ui_hash: (v) => optional(assertString)(v, 'ui_hash'),

};

registerSanitizedValidators(LocalizedText, localizedtextValidators);