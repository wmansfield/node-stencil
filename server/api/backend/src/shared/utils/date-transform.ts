const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;

function isDateString(str: string): boolean {
   if (!ISO_DATE_PATTERN.test(str)) {
      return false;
   }
   const date = new Date(str);
   return !isNaN(date.getTime());
}

/**
 * Recursively converts ISO 8601 date strings to Date objects in an object or array.
 */
export function transformDates(obj: any): any {
   if (obj === null || obj === undefined) {
      return obj;
   }

   if (typeof obj === 'string' && isDateString(obj)) {
      return new Date(obj);
   }

   if (Array.isArray(obj)) {
      return obj.map(item => transformDates(item));
   }

   if (typeof obj === 'object') {
      const transformed: any = {};
      for (const key in obj) {
         if (obj.hasOwnProperty(key)) {
            transformed[key] = transformDates(obj[key]);
         }
      }
      return transformed;
   }

   return obj;
}
