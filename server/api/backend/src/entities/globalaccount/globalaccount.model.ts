import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class GlobalAccount {
   static Projection = {
      _id: 1,
      auth_identifier: 1,
      jurisdiction_id: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
   auth_identifier: string;
   jurisdiction_id: string;
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
   

   constructor(data: Partial<GlobalAccount>) {
      Object.assign(this, data);
   }

   static sanitize(obj: GlobalAccount): void {
      if (!obj) return;
      obj.auth_identifier = sanitizeHtml(obj.auth_identifier, false);
      obj.jurisdiction_id = sanitizeHtml(obj.jurisdiction_id, false);
   }
   
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<GlobalAccount>): void {
      
      if (partial.auth_identifier !== undefined) {
         this.auth_identifier = partial.auth_identifier!;
      }
      
      if (partial.jurisdiction_id !== undefined) {
         this.jurisdiction_id = partial.jurisdiction_id!;
      }
      
   }
}