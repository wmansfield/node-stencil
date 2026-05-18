import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { FullDate } from './fulldate.model';
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


const fulldateValidators: SanitizedValidatorMap = {
utc: (v) => optional(assertDate)(v, 'utc'),
local: (v) => optional(assertString)(v, 'local'),
literal: (v) => assertString(v, 'literal'),
iana_zone: (v) => assertString(v, 'iana_zone'),

};

registerSanitizedValidators(FullDate, fulldateValidators);