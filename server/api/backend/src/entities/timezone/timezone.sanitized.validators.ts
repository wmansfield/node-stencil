import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { Timezone } from './timezone.model';
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



const timezoneValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertString)(v, '_id'),
iana_zone: (v) => assertString(v, 'iana_zone'),
display_name: (v) => assertString(v, 'display_name'),
ui_sort: (v) => assertString(v, 'ui_sort'),
tag: (v) => optional(assertString)(v, 'tag'),

};

registerSanitizedValidators(Timezone, timezoneValidators);


const timezonepublicValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertString)(v, '_id'),
iana_zone: (v) => assertString(v, 'iana_zone'),
ui_sort: (v) => assertString(v, 'ui_sort'),
display_name: (v) => assertString(v, 'display_name'),

};

registerSanitizedValidators(Timezone.Public, timezonepublicValidators);