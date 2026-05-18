import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class Role {
   static Projection = {
      _id: 1,
      role_name: 1,
      permissions: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
   role_name: string;
   permissions: string[];
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
   

   constructor(data: Partial<Role>) {
      Object.assign(this, data);
   }

   static sanitize(obj: Role): void {
      if (!obj) return;
      obj._id = sanitizeHtml(obj._id, false);
      obj.role_name = sanitizeHtml(obj.role_name, false);
   }
   
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<Role>): void {
      
      if (partial.role_name !== undefined) {
         this.role_name = partial.role_name!;
      }
      
      if (partial.permissions !== undefined) {
         this.permissions = partial.permissions!;
      }
      
   }
}