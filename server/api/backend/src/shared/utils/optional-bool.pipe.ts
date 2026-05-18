import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * A pipe that converts string query parameters to booleans, handling optional values gracefully.
 *
 * - Returns `undefined` for undefined, null, or empty string values
 * - Converts "true", "1", "yes" (case-insensitive) to `true`
 * - Converts "false", "0", "no" (case-insensitive) to `false`
 * - Returns `undefined` for invalid boolean strings (instead of throwing an error)
 *
 * Usage:
 * @Query('only_pending', OptionalBoolPipe) only_pending: boolean = false
 * @Query('enabled', OptionalBoolPipe) enabled?: boolean
 */
@Injectable()
export class OptionalBoolPipe implements PipeTransform {
   transform(value: any, metadata: ArgumentMetadata) {
      if (value === undefined || value === null || value === '') {
         return undefined;
      }

      const normalized = String(value).toLowerCase().trim();

      // Truthy values
      if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
         return true;
      }

      // Falsy values
      if (normalized === 'false' || normalized === '0' || normalized === 'no') {
         return false;
      }

      // Invalid value - return undefined instead of throwing
      return undefined;
   }
}
