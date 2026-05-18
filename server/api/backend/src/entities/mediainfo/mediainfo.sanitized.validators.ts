import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { MediaInfo } from './mediainfo.model';
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
import { Dimension } from 'src/entities/dimension/dimension.model';
import 'src/entities/dimension/dimension.sanitized.validators';


const mediainfoValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
asset_kind: (v) => optional(assertEnum(AssetKind))(v, 'asset_kind'),
jurisdiction_id: (v) => optional(assertString)(v, 'jurisdiction_id'),
storage_key: (v) => optional(assertString)(v, 'storage_key'),
thumb_small_key: (v) => optional(assertString)(v, 'thumb_small_key'),
thumb_small_url: (v) => optional(assertString)(v, 'thumb_small_url'),
thumb_small_dimensions: (v) => optional(assertNested(Dimension))(v, 'thumb_small_dimensions'),
thumb_large_key: (v) => optional(assertString)(v, 'thumb_large_key'),
thumb_large_url: (v) => optional(assertString)(v, 'thumb_large_url'),
thumb_large_dimensions: (v) => optional(assertNested(Dimension))(v, 'thumb_large_dimensions'),
raw_url: (v) => optional(assertString)(v, 'raw_url'),

};

registerSanitizedValidators(MediaInfo, mediainfoValidators);