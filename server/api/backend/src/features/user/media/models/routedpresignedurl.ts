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


import { PreSignedUrl } from 'src/entities/presignedurl/presignedurl.model';


export interface IRoutedPreSignedUrl {
	presigned: PreSignedUrl;
   jurisdiction_id: string;
   
}

/** Registry key for Sanitize.for(RoutedPreSignedUrl). Use @Body(Sanitize.for(RoutedPreSignedUrl)) input: IRoutedPreSignedUrl. */
export class RoutedPreSignedUrl {}

const routedpresignedurlValidators: SanitizedValidatorMap = {
presigned: (v) => assertNested(PreSignedUrl)(v, 'presigned'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),

};

registerSanitizedValidators(RoutedPreSignedUrl, routedpresignedurlValidators);