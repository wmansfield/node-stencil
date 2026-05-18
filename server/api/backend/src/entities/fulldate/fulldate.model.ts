import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class FullDate {
   utc?: Date;
   local?: string;
   literal: string;
   iana_zone: string;
   

   constructor(data: Partial<FullDate>) {
      Object.assign(this, data);
   }

   static sanitize(obj: FullDate): void {
      if (!obj) return;
      obj.local = sanitizeHtml(obj.local, false);
      obj.literal = sanitizeHtml(obj.literal, false);
      obj.iana_zone = sanitizeHtml(obj.iana_zone, false);
   }
}