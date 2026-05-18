import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class JurisdictionSetting {
   static Projection = {
      _id: 1,
      name: 1,
      jurisdiction_id: 1,
      value: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
   name: string;
   jurisdiction_id: string;
   value?: string;
   /**
   * System Field
   */
   created_utc?: Date;
   /**
   * System Field
   */
   updated_utc?: Date;
   
   /**
   * System Field
   */
   searchable?: string;
   

   constructor(data: Partial<JurisdictionSetting>) {
      Object.assign(this, data);
   }

   static sanitize(obj: JurisdictionSetting): void {
      if (!obj) return;
      obj._id = sanitizeHtml(obj._id, false);
      obj.name = sanitizeHtml(obj.name, false);
      obj.jurisdiction_id = sanitizeHtml(obj.jurisdiction_id, false);
   }
   
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<JurisdictionSetting>): void {
      
      if (partial.name !== undefined) {
         this.name = partial.name!;
      }
      
      if (partial.jurisdiction_id !== undefined) {
         this.jurisdiction_id = partial.jurisdiction_id!;
      }
      
      if (partial.value !== undefined) {
         this.value = partial.value!;
      }
      
   }
}