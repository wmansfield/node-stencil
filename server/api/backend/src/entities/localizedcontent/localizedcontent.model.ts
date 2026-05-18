import { ContentSection } from 'src/entities/contentsection/contentsection.model';

import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class LocalizedContent {
   language_code?: string;
   contents?: ContentSection[];
   ui_hash?: string;
   

   constructor(data: Partial<LocalizedContent>) {
      Object.assign(this, data);
   }

   static sanitize(obj: LocalizedContent): void {
      if (!obj) return;
      obj.language_code = sanitizeHtml(obj.language_code, false);
      obj.ui_hash = sanitizeHtml(obj.ui_hash, false);
      obj.contents?.forEach(item => ContentSection.sanitize(item));
   }
}