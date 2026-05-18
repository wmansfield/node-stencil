import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { ContentSection } from './contentsection.model';
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
import { ContentSectionKind } from 'src/entities/enums/contentsectionkind';
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';
import 'src/entities/mediainfo/mediainfo.sanitized.validators';
import { PreSignedUrl } from 'src/entities/presignedurl/presignedurl.model';
import 'src/entities/presignedurl/presignedurl.sanitized.validators';


const contentsectionValidators: SanitizedValidatorMap = {
section_kind: (v) => assertEnum(ContentSectionKind)(v, 'section_kind'),
markdown: (v) => optional(assertString)(v, 'markdown'),
text: (v) => optional(assertString)(v, 'text'),
target: (v) => optional(assertString)(v, 'target'),
sequence: (v) => optional(assertNumber)(v, 'sequence'),
asset_id: (v) => optional(assertUuid)(v, 'asset_id'),
ui_tag: (v) => optional(assertString)(v, 'ui_tag'),
ui_text: (v) => optional(assertString)(v, 'ui_text'),
photo: (v) => optional(assertNested(MediaInfo))(v, 'photo'),
upload_info: (v) => optional(assertNested(PreSignedUrl))(v, 'upload_info'),

};

registerSanitizedValidators(ContentSection, contentsectionValidators);