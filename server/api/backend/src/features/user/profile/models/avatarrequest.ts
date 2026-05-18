import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import {
   assertString,
   assertStringArray,
   assertBoolean,
   assertNumber,
   assertUuid,
   assertDate,
   assertEnum,
   assertEnumArray,
   assertNested,
   assertNestedArray,
   assertPlainObject,
   optional,
} from 'src/shared/utils/sanitized.validators';



export interface IAvatarRequest {
	asset_id: string;
   
}

/** Registry key for Sanitize.for(AvatarRequest). Use @Body(Sanitize.for(AvatarRequest)) input: IAvatarRequest. */
export class AvatarRequest {}

const avatarrequestValidators: SanitizedValidatorMap = {
asset_id: (v) => assertUuid(v, 'asset_id'),

};

registerSanitizedValidators(AvatarRequest, avatarrequestValidators);