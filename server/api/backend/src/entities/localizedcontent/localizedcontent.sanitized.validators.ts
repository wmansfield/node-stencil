import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { LocalizedContent } from './localizedcontent.model';
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
import { ContentSection } from 'src/entities/contentsection/contentsection.model';
import 'src/entities/contentsection/contentsection.sanitized.validators';


const localizedcontentValidators: SanitizedValidatorMap = {
language_code: (v) => optional(assertString)(v, 'language_code'),
contents: (v) => optional(assertNestedArray(ContentSection))(v, 'contents'),
ui_hash: (v) => optional(assertString)(v, 'ui_hash'),

};

registerSanitizedValidators(LocalizedContent, localizedcontentValidators);