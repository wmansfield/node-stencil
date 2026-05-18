import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { Role } from './role.model';
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



const roleValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertString)(v, '_id'),
role_name: (v) => assertString(v, 'role_name'),
permissions: (v) => assertStringArray(v, 'permissions'),

};

registerSanitizedValidators(Role, roleValidators);