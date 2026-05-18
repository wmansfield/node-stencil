import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { Jurisdiction } from './jurisdiction.model';
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



const jurisdictionValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertString)(v, '_id'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),

};

registerSanitizedValidators(Jurisdiction, jurisdictionValidators);


const jurisdictionpublicValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertString)(v, '_id'),

};

registerSanitizedValidators(Jurisdiction.Public, jurisdictionpublicValidators);