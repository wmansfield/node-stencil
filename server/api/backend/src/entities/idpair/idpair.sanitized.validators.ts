import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { IDPair } from './idpair.model';
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


const idpairValidators: SanitizedValidatorMap = {
_id: (v) => assertString(v, '_id'),
text: (v) => assertString(v, 'text'),

};

registerSanitizedValidators(IDPair, idpairValidators);