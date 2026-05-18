import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { Widget } from './widget.model';
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

import { LocalizedText } from '../localizedtext/localizedtext.model';
import '../localizedtext/localizedtext.sanitized.validators';
import { LocalizedContent } from '../localizedcontent/localizedcontent.model';
import '../localizedcontent/localizedcontent.sanitized.validators';
import { FullDate } from '../fulldate/fulldate.model';
import '../fulldate/fulldate.sanitized.validators';
import { IDPair } from '../idpair/idpair.model';
import '../idpair/idpair.sanitized.validators';
import { MediaInfo } from '../mediainfo/mediainfo.model';
import '../mediainfo/mediainfo.sanitized.validators';


const widgetValidators: SanitizedValidatorMap = {
_id: (v) => optional(assertUuid)(v, '_id'),
jurisdiction_id: (v) => assertString(v, 'jurisdiction_id'),
asset_id_media: (v) => optional(assertUuid)(v, 'asset_id_media'),
title: (v) => assertString(v, 'title'),
title_localized: (v) => optional(assertNestedArray(LocalizedText))(v, 'title_localized'),
description: (v) => optional(assertString)(v, 'description'),
description_localized: (v) => optional(assertNestedArray(LocalizedContent))(v, 'description_localized'),
published_date: (v) => optional(assertNested(FullDate))(v, 'published_date'),
reference: (v) => optional(assertNested(IDPair))(v, 'reference'),

};

registerSanitizedValidators(Widget, widgetValidators);