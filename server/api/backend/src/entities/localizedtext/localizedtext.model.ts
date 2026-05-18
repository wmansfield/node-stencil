import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class LocalizedText {
   language_code?: string;
   text?: string;
   ui_hash?: string;
   

   constructor(data: Partial<LocalizedText>) {
      Object.assign(this, data);
   }

   static sanitize(obj: LocalizedText): void {
      if (!obj) return;
      obj.language_code = sanitizeHtml(obj.language_code, false);
      obj.text = sanitizeHtml(obj.text, false);
      obj.ui_hash = sanitizeHtml(obj.ui_hash, false);
   }
}