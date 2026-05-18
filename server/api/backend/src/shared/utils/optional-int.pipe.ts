import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * A pipe that converts string query parameters to integers, handling optional values gracefully.
 *
 * - Returns `undefined` for undefined, null, or empty string values
 * - Converts valid numeric strings to integers
 * - Returns `undefined` for invalid numeric strings (instead of throwing an error)
 *
 * Usage:
 * @Query('skip', OptionalIntPipe) skip: number = 0
 * @Query('take', OptionalIntPipe) take: number = 10
 * @Query('ui_area', OptionalIntPipe) ui_area?: UIArea
 */
@Injectable()
export class OptionalIntPipe implements PipeTransform {
   transform(value: any, metadata: ArgumentMetadata) {
      if (value === undefined || value === null || value === '') {
         return undefined;
      }
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? undefined : parsed;
   }
}
