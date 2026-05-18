import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { JurisdictionSetting } from './jurisdictionsetting.model';
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



const jurisdictionsettingValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertString)(v, '_id'),
name: (v) => assertString(v, 'name'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),
value: (v) => optional(assertString)(v, 'value'),

};

registerSanitizedValidators(JurisdictionSetting, jurisdictionsettingValidators);