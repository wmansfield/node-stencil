import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { GlobalAccount } from './globalaccount.model';
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



const globalaccountValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
auth_identifier: (v) => assertString(v, 'auth_identifier'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),

};

registerSanitizedValidators(GlobalAccount, globalaccountValidators);