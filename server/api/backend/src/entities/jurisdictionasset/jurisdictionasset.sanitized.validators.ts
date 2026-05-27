import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { JurisdictionAsset } from './jurisdictionasset.model';
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

import { AssetKind } from 'src/entities/enums/assetkind';
import { AssetDependency } from 'src/entities/enums/assetdependency';
import { Dimension } from '../dimension/dimension.model';
import '../dimension/dimension.sanitized.validators';


const jurisdictionassetValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),
asset_kind: (v) => assertEnum(AssetKind)(v, 'asset_kind'),
file_name: (v) => assertString(v, 'file_name'),
storage_key: (v) => assertString(v, 'storage_key'),
size_kb: (v) => optional(assertNumber)(v, 'size_kb'),
duration_secs: (v) => optional(assertNumber)(v, 'duration_secs'),
dependency: (v) => optional(assertEnum(AssetDependency))(v, 'dependency'),
account_id_creator: (v) => optional(assertUuid)(v, 'account_id_creator'),
dependency_id: (v) => optional(assertUuid)(v, 'dependency_id'),
available: (v) => assertBoolean(v, 'available'),
resize_required: (v) => assertBoolean(v, 'resize_required'),
resize_status: (v) => optional(assertString)(v, 'resize_status'),
resize_attempts: (v) => optional(assertNumber)(v, 'resize_attempts'),
resize_attempt_utc: (v) => optional(assertDate)(v, 'resize_attempt_utc'),
resize_log: (v) => optional(assertString)(v, 'resize_log'),
thumb_dimensions: (v) => optional(assertNested(Dimension))(v, 'thumb_dimensions'),
large_dimensions: (v) => optional(assertNested(Dimension))(v, 'large_dimensions'),
thumb_small_key: (v) => optional(assertString)(v, 'thumb_small_key'),
thumb_large_key: (v) => optional(assertString)(v, 'thumb_large_key'),

};

registerSanitizedValidators(JurisdictionAsset, jurisdictionassetValidators);


const jurisdictionassetinfoValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),
asset_kind: (v) => assertEnum(AssetKind)(v, 'asset_kind'),
storage_key: (v) => assertString(v, 'storage_key'),
thumb_dimensions: (v) => optional(assertNested(Dimension))(v, 'thumb_dimensions'),
large_dimensions: (v) => optional(assertNested(Dimension))(v, 'large_dimensions'),
thumb_small_key: (v) => optional(assertString)(v, 'thumb_small_key'),
thumb_large_key: (v) => optional(assertString)(v, 'thumb_large_key'),
duration_secs: (v) => optional(assertNumber)(v, 'duration_secs'),
size_kb: (v) => optional(assertNumber)(v, 'size_kb'),
thumb_small_url: (v) => optional(assertString)(v, 'thumb_small_url'),
thumb_large_url: (v) => optional(assertString)(v, 'thumb_large_url'),
raw_url: (v) => optional(assertString)(v, 'raw_url'),

};

registerSanitizedValidators(JurisdictionAsset.Info, jurisdictionassetinfoValidators);