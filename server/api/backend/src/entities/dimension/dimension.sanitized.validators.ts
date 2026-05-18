import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { Dimension } from './dimension.model';
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


const dimensionValidators: SanitizedValidatorMap = {
width: (v) => assertNumber(v, 'width'),
height: (v) => assertNumber(v, 'height'),

};

registerSanitizedValidators(Dimension, dimensionValidators);