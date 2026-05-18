import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class IDPair {
   _id: string;
   text: string;
   

   constructor(data: Partial<IDPair>) {
      Object.assign(this, data);
   }

   static sanitize(obj: IDPair): void {
      if (!obj) return;
      obj._id = sanitizeHtml(obj._id, false);
      obj.text = sanitizeHtml(obj.text, false);
   }
}