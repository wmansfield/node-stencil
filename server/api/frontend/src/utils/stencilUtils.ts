import moment from 'moment';

class StencilUtils {
   static getApiErrorMessage(exception: any, default_message: string = 'Error disconnecting.'): string {
      let message = default_message;
      if (exception?.response?.data?.title) {
         message = exception.response.data.title;
         if (exception.response.data.errors) {
            message += '\n';
            for (const key in exception.response.data.errors) {
               if (Object.prototype.hasOwnProperty.call(exception.response.data.errors, key)) {
                  message += `\n${key}: ${exception.response.data.errors[key]}`;
               }
            }
         }
      } else if (exception.message) {
         message = exception.message;
      } else {
         const error = exception?.response?.data;
         if (error) {
            if (typeof error === 'string') {
               message = error;
            }
         }
      }
      return message;
   }

   static parseIntOrDefault(value: string | undefined, defaultValue: number): number {
      if (!value || this.isNullOrWhiteSpace(value)) {
         return defaultValue;
      } else {
         return parseInt(value);
      }
   }
   static parseDate(value: any, format: number = 1): Date {
      return moment(value, ['MM/DD/YYYY', 'M/DD/YYYY', 'M/D/YYYY', 'YYYY-MM-DDTHH:mm:ssZZ', 'YYYY-MM-DDTHH:mm:ss.SSSZZ'], true).toDate();
   }
   static truncateText(value: string, max: number): string {
      if (!value || value.length < max) {
         return value;
      }
      return value.substring(0, max) + '...';
   }
   static parseAndFormatDate(value: any, format: number = 1): string {
      if (value) {
         if (format === 1) {
            return moment(value).format('MMM D, YYYY');
         } else if (format === 2) {
            return moment(value).format('dddd, MMMM D, YYYY');
         } else if (format === 3) {
            return moment(value).format('dddd');
         } else if (format === 4) {
            var parsed = moment(value, ['MM/DD/YYYY', 'M/DD/YYYY', 'M/D/YYYY', 'YYYY-MM-DDTHH:mm:ssZZ', 'YYYY-MM-DDTHH:mm:ss.SSSZZ'], true);
            if (parsed.isValid()) {
               return moment(value).format('MM/DD/YYYY');
            }
            return value;
         } else if (format === 5) {
            return moment(value).format('M/D/YYYY h:mm a');
         } else if (format === 6) {
            return moment(value).format('h:mm a');
         } else if (format === 7) {
            return moment(value).format('MMM D, YYYY');
         } else {
            return StencilUtils.explicitParseDate(value, [
               'MM/DD/YYYY',
               'YYYY-MM-DDTHH:mm:ssZZ',
               'MM/DD/YYYY hh:mm:ss A',
               'M/DD/YYYY hh:mm:ss A',
               'MM/D/YYYY hh:mm:ss A',
               'M/D/YYYY hh:mm:ss A',
            ]);
         }
      } else {
         return '';
      }
   }
   static parseAndFormatDateLiteral(value: any, format: number = 1): string {
      if (value) {
         const parsed = moment(value, ['YYYY-MM-DDTHH:mm:ss'], false);

         if (format === 1) {
            return parsed.format('MMM D, YYYY');
         } else if (format === 2) {
            return parsed.format('dddd, MMMM DD YYYY');
         } else if (format === 3) {
            return parsed.format('dddd');
         } else if (format === 4) {
            return parsed.format('MM/DD/YYYY');
         } else if (format === 5) {
            return parsed.format('M/D/YYYY h:mm a');
         } else if (format === 6) {
            return parsed.format('h:mm a');
         } else {
            return StencilUtils.explicitParseDate(value, [
               'MM/DD/YYYY',
               'YYYY-MM-DDTHH:mm:ssZZ',
               'MM/DD/YYYY hh:mm:ss A',
               'M/DD/YYYY hh:mm:ss A',
               'MM/D/YYYY hh:mm:ss A',
               'M/D/YYYY hh:mm:ss A',
            ]);
         }
      } else {
         return '';
      }
   }

   static explicitParseDate(value: any, formats: string[]) {
      for (const format of formats) {
         let parsed = moment(value, format, true);
         if (parsed.isValid()) {
            return moment(value).format('MM/DD/YYYY');
         }
      }
      return value;
   }
   static isZero(amount: any) {
      if (amount != null) {
         let parsed = parseFloat(amount);
         if (!isNaN(parsed)) {
            return parsed <= 0;
         }
      }
      return true;
   }

   static isLastChild(arr: Array<unknown>, index: number) {
      return arr.length === index + 1;
   }

   static isNullOrWhiteSpace(value: string | null | undefined): boolean {
      return value === null || value === undefined || value.trim().length === 0;
   }
}

export default StencilUtils;
