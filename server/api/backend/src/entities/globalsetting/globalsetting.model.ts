import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class GlobalSetting {
   static Projection = {
      _id: 1,
      name: 1,
      value: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
   name: string;
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
   

   constructor(data: Partial<GlobalSetting>) {
      Object.assign(this, data);
   }

   static sanitize(obj: GlobalSetting): void {
      if (!obj) return;
      obj._id = sanitizeHtml(obj._id, false);
      obj.name = sanitizeHtml(obj.name, false);
   }
   
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<GlobalSetting>): void {
      
      if (partial.name !== undefined) {
         this.name = partial.name!;
      }
      
      if (partial.value !== undefined) {
         this.value = partial.value!;
      }
      
   }
}