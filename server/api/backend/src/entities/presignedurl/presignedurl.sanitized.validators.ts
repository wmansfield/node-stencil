import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { PreSignedUrl } from './presignedurl.model';
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


const presignedurlValidators: SanitizedValidatorMap = {
id: (v) => assertString(v, 'id'),
url: (v) => assertString(v, 'url'),
signed_url: (v) => assertString(v, 'signed_url'),
mime_type: (v) => assertString(v, 'mime_type'),
asset_kind: (v) => assertEnum(AssetKind)(v, 'asset_kind'),
dependency: (v) => optional(assertEnum(AssetDependency))(v, 'dependency'),
dependency_id: (v) => optional(assertUuid)(v, 'dependency_id'),

};

registerSanitizedValidators(PreSignedUrl, presignedurlValidators);