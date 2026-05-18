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


import { AssetKind } from 'src/entities/enums/assetkind';

import { AssetArea } from 'src/entities/enums/assetarea';


export interface IUploadInfo {
	asset_kind: AssetKind;
   asset_area: AssetArea;
   file_name: string;
   mime_type: string;
   size_kb?: number;
   duration_secs?: number;
   jurisdiction_id: string;
   
}

/** Registry key for Sanitize.for(UploadInfo). Use @Body(Sanitize.for(UploadInfo)) input: IUploadInfo. */
export class UploadInfo {}

const uploadinfoValidators: SanitizedValidatorMap = {
asset_kind: (v) => assertEnum(AssetKind)(v, 'asset_kind'),
asset_area: (v) => assertEnum(AssetArea)(v, 'asset_area'),
file_name: (v) => assertString(v, 'file_name'),
mime_type: (v) => assertString(v, 'mime_type'),
size_kb: (v) => optional(assertNumber)(v, 'size_kb'),
duration_secs: (v) => optional(assertNumber)(v, 'duration_secs'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),

};

registerSanitizedValidators(UploadInfo, uploadinfoValidators);