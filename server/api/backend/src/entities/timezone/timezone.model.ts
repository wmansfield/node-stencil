import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class Timezone {
   static Projection = {
      _id: 1,
      iana_zone: 1,
      display_name: 1,
      ui_sort: 1,
      tag: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
   iana_zone: string;
   display_name: string;
   ui_sort: string;
   tag?: string;
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
   

   constructor(data: Partial<Timezone>) {
      Object.assign(this, data);
   }

   static sanitize(obj: Timezone): void {
      if (!obj) return;
      obj._id = sanitizeHtml(obj._id, false);
      obj.iana_zone = sanitizeHtml(obj.iana_zone, false);
      obj.display_name = sanitizeHtml(obj.display_name, false);
      obj.ui_sort = sanitizeHtml(obj.ui_sort, false);
      obj.tag = sanitizeHtml(obj.tag, false);
   }
   
   
   toPublic(): Timezone.Public {
      return Timezone.Public.fromTimezone(this);
   }
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<Timezone>): void {
      
      if (partial.iana_zone !== undefined) {
         this.iana_zone = partial.iana_zone!;
      }
      
      if (partial.display_name !== undefined) {
         this.display_name = partial.display_name!;
      }
      
      if (partial.ui_sort !== undefined) {
         this.ui_sort = partial.ui_sort!;
      }
      
      if (partial.tag !== undefined) {
         this.tag = partial.tag!;
      }
      
   }
}


export namespace Timezone {
   
   // ===========================================
   // Projections
   // ===========================================
   
   export class Public
   {
      static Projection = {
         _id: 1,
         iana_zone: 1,
         ui_sort: 1,
         display_name: 1,
         
      };

      static fromTimezone(data: Timezone) : Public {
         const result = new Public();
         result._id = data._id;
         result.iana_zone = data.iana_zone;
         result.ui_sort = data.ui_sort;
         result.display_name = data.display_name;
         
         return result;
      }
      static copyToTimezone(source: Timezone.Public, target: Timezone): void {
         //Disallow: target._id = source._id;
         target.iana_zone = source.iana_zone;
         target.ui_sort = source.ui_sort;
         target.display_name = source.display_name;
         
      }

      _id: string;
      iana_zone: string;
      ui_sort: string;
      display_name: string;
      
   }
   
}