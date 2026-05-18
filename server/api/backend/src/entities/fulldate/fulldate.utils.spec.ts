import { parseAndValidateFullDate } from './fulldate.utils';
import { FullDate } from './fulldate.model';

describe('parseAndValidateFullDate', () => {
   describe('Basic functionality', () => {
      it('should parse a simple date without timezone info', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T04:00:00.000',
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         expect(result?.literal).toBe('2025-10-31T04:00:00.000');
         expect(result?.iana_zone).toBe('America/New_York');
         expect(result?.utc).toBeInstanceOf(Date);
         expect(result?.local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
      });

      it('should strip timezone info from literal', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T04:00:00.000-05:00',
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         expect(result?.literal).toBe('2025-10-31T04:00:00.000-05:00'); // Original preserved
         expect(result?.utc).toBeInstanceOf(Date);
      });

      it('should handle date-only input', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31',
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         expect(result?.utc).toBeInstanceOf(Date);
         expect(result?.local).toContain('2025-10-31T00:00:00.000');
      });

      it('should handle Z suffix in literal', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T04:00:00.000Z',
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         expect(result?.utc).toBeInstanceOf(Date);
      });
   });

   describe('Timezone conversions', () => {
      it('should convert EST time to UTC correctly', () => {
         const input: Partial<FullDate> = {
            literal: '2025-01-15T14:30:00.000', // 2:30 PM EST
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // EST is UTC-5, so 14:30 EST = 19:30 UTC
         expect(result?.utc!.getUTCHours()).toBe(19);
         expect(result?.utc!.getUTCMinutes()).toBe(30);
         expect(result?.local).toContain('-05:00'); // EST offset
      });

      it('should convert EDT time to UTC correctly', () => {
         const input: Partial<FullDate> = {
            literal: '2025-07-15T14:30:00.000', // 2:30 PM EDT
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // EDT is UTC-4, so 14:30 EDT = 18:30 UTC
         expect(result?.utc!.getUTCHours()).toBe(18);
         expect(result?.utc!.getUTCMinutes()).toBe(30);
         expect(result?.local).toContain('-04:00'); // EDT offset
      });

      it('should handle UTC timezone', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T14:30:00.000',
            iana_zone: 'UTC',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // UTC time should remain the same
         expect(result?.utc!.getUTCHours()).toBe(14);
         expect(result?.utc!.getUTCMinutes()).toBe(30);
         expect(result?.local).toContain('Z'); // UTC is represented as Z
      });

      it('should handle positive timezone offset', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T14:30:00.000',
            iana_zone: 'Asia/Tokyo',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // JST is UTC+9, so 14:30 JST = 05:30 UTC
         expect(result?.utc!.getUTCHours()).toBe(5);
         expect(result?.utc!.getUTCMinutes()).toBe(30);
         expect(result?.local).toContain('+09:00'); // JST offset
      });
   });

   describe('Daylight Saving Time transitions', () => {
      it('should handle spring forward transition (EST to EDT)', () => {
         // March 9, 2025 - Spring forward (2 AM becomes 3 AM)
         const input: Partial<FullDate> = {
            literal: '2025-03-09T02:30:00.000', // 2:30 AM (this time doesn't exist on spring forward day)
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // The library should handle the DST transition
         expect(result?.utc).toBeInstanceOf(Date);
         // The time will be adjusted to 3:30 AM EDT since 2:30 AM doesn't exist
         expect(result?.local).toContain('2025-03-09T03:30:00.000');
      });

      it('should handle fall back transition (EDT to EST)', () => {
         // November 2, 2025 - Fall back (2 AM becomes 1 AM)
         const input: Partial<FullDate> = {
            literal: '2025-11-02T01:30:00.000', // 1:30 AM (this time exists twice on fall back day)
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // The library should handle the DST transition
         expect(result?.utc).toBeInstanceOf(Date);
         expect(result?.local).toContain('2025-11-02T01:30:00.000');
      });

      it('should handle time just before spring forward', () => {
         const input: Partial<FullDate> = {
            literal: '2025-03-09T01:59:00.000', // 1:59 AM EST
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // 1:59 AM EST = 6:59 AM UTC
         expect(result?.utc!.getUTCHours()).toBe(6);
         expect(result?.utc!.getUTCMinutes()).toBe(59);
         expect(result?.local).toContain('-05:00'); // EST offset
      });

      it('should handle time just after spring forward', () => {
         const input: Partial<FullDate> = {
            literal: '2025-03-09T03:00:00.000', // 3:00 AM EDT
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // 3:00 AM EDT = 7:00 AM UTC
         expect(result?.utc!.getUTCHours()).toBe(7);
         expect(result?.utc!.getUTCMinutes()).toBe(0);
         expect(result?.local).toContain('-04:00'); // EDT offset
      });
   });

   describe('Edge cases and validation', () => {
      it('should throw error for missing literal', () => {
         const input: Partial<FullDate> = {
            iana_zone: 'America/New_York',
         };

         expect(() => parseAndValidateFullDate(input as FullDate)).toThrow();
      });

      it('should throw error for missing timezone', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T04:00:00.000',
         };

         expect(() => parseAndValidateFullDate(input as FullDate)).toThrow();
      });

      it('should throw error for invalid date format', () => {
         const input: Partial<FullDate> = {
            literal: 'invalid-date',
            iana_zone: 'America/New_York',
         };

         expect(() => parseAndValidateFullDate(input as FullDate)).toThrow();
      });

      it('should handle different time formats', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T04:00:00', // No milliseconds
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         expect(result?.utc).toBeInstanceOf(Date);
      });

      it('should handle different offset formats in literal', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T04:00:00.000+0500', // No colon in offset
            iana_zone: 'America/New_York',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         expect(result?.utc).toBeInstanceOf(Date);
      });
   });

   describe('Different timezones', () => {
      it('should handle European timezone', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T14:30:00.000',
            iana_zone: 'Europe/London',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // In October, London is UTC+0 (GMT), so 14:30 GMT = 14:30 UTC
         expect(result?.utc!.getUTCHours()).toBe(14);
         expect(result?.utc!.getUTCMinutes()).toBe(30);
         expect(result?.local).toContain('Z'); // GMT offset (UTC is represented as Z)
      });

      it('should handle Pacific timezone', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T14:30:00.000',
            iana_zone: 'America/Los_Angeles',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // In October, LA is UTC-7 (PDT), so 14:30 PDT = 21:30 UTC
         expect(result?.utc!.getUTCHours()).toBe(21);
         expect(result?.utc!.getUTCMinutes()).toBe(30);
         expect(result?.local).toContain('-07:00'); // PDT offset
      });

      it('should handle Australian timezone', () => {
         const input: Partial<FullDate> = {
            literal: '2025-10-31T14:30:00.000',
            iana_zone: 'Australia/Sydney',
         };

         const result = parseAndValidateFullDate(input as FullDate);

         expect(result).toBeDefined();
         // In October, Sydney is UTC+11 (AEDT), so 14:30 AEDT = 03:30 UTC
         expect(result?.utc!.getUTCHours()).toBe(3);
         expect(result?.utc!.getUTCMinutes()).toBe(30);
         expect(result?.local).toContain('+11:00'); // AEDT offset
      });
   });
});
