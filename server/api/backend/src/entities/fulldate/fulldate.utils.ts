import { UIException } from 'src/shared/exceptions/friendly-exception';
import { FullDate } from './fulldate.model';
import { LocalizableString } from 'src/shared/types/i18n/localizable-string';
import { fromZonedTime, format } from 'date-fns-tz';

export function parseAndValidateFullDate(fullDate: FullDate): FullDate {
   if (!fullDate.literal || !fullDate.iana_zone) {
      throw new UIException(new LocalizableString('fullDate.literalRequired', 'Dates must have at minimum a literal and timezone'));
   }

   const result: Partial<FullDate> = {
      literal: fullDate.literal,
      iana_zone: fullDate.iana_zone,
   };

   try {
      // Strip any timezone information from the literal
      // The literal should be a "naive" local time (e.g., "2025-10-31T04:00:00.000")
      const cleanLiteral = stripTimezoneFromLiteral(fullDate.literal);

      // Parse the cleaned literal as a naive local time
      const naiveDate = new Date(cleanLiteral);

      // Validate that the date is valid
      if (isNaN(naiveDate.getTime())) {
         throw new UIException(new LocalizableString('fullDate.invalidDate', 'Invalid date format provided'));
      }

      // Convert the naive local time to UTC using the specified timezone
      // This treats the naiveDate as if it's in the iana_zone timezone
      const utcDate = fromZonedTime(naiveDate, fullDate.iana_zone);

      // Format the local time with proper timezone offset
      // This creates a string like "2025-10-31T04:00:00-05:00"
      const localWithOffset = format(naiveDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX', {
         timeZone: fullDate.iana_zone,
      });

      result.local = localWithOffset;
      result.utc = utcDate;

      return result as FullDate;
   } catch (error) {
      if (error instanceof UIException) {
         throw error;
      }
      throw new UIException(new LocalizableString('fullDate.parseError', 'The provided date cannot be parsed, correct it and try again.'));
   }
}

/**
 * Strips timezone information from a date literal string
 * @param literal - The date string that may contain timezone info
 * @returns Clean date string without timezone information
 */
function stripTimezoneFromLiteral(literal: string): string {
   // Remove timezone offset patterns like +05:00, -05:00, +0500, -0500
   let clean = literal.replace(/[+-]\d{2}:?\d{2}$/, '');

   // Remove 'Z' suffix (UTC indicator)
   clean = clean.replace(/Z$/, '');

   // Ensure we have a valid format - if it looks like ISO but missing timezone, it's good
   // If it's missing time part, add default time
   if (!clean.includes('T') && clean.match(/^\d{4}-\d{2}-\d{2}$/)) {
      clean += 'T00:00:00.000';
   }

   return clean;
}
