import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class Jurisdiction {
   static Projection = {
      _id: 1,
      jurisdiction_id: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
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
   

   constructor(data: Partial<Jurisdiction>) {
      Object.assign(this, data);
   }

   static sanitize(obj: Jurisdiction): void {
      if (!obj) return;
      obj._id = sanitizeHtml(obj._id, false);
      obj.jurisdiction_id = sanitizeHtml(obj.jurisdiction_id, false);
   }
   
   
   toPublic(): Jurisdiction.Public {
      return Jurisdiction.Public.fromJurisdiction(this);
   }
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<Jurisdiction>): void {
      
      if (partial.jurisdiction_id !== undefined) {
         this.jurisdiction_id = partial.jurisdiction_id!;
      }
      
   }
}


export namespace Jurisdiction {
   
   // ===========================================
   // Projections
   // ===========================================
   
   export class Public
   {
      static Projection = {
         _id: 1,
         
      };

      static fromJurisdiction(data: Jurisdiction) : Public {
         const result = new Public();
         result._id = data._id;
         
         return result;
      }
      static copyToJurisdiction(source: Jurisdiction.Public, target: Jurisdiction): void {
         //Disallow: target._id = source._id;
         
      }

      _id: string;
      
   }
   
}