import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { GlobalSetting } from './globalsetting.model';
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



const globalsettingValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertString)(v, '_id'),
name: (v) => assertString(v, 'name'),
value: (v) => optional(assertString)(v, 'value'),

};

registerSanitizedValidators(GlobalSetting, globalsettingValidators);