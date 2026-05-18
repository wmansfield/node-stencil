import { BadRequestException } from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';
import { getSanitizedValidators } from './sanitized.registry';

/** Throws BadRequestException if value is not a string (when present). */
export function assertString(value: unknown, key: string): void {
   if (value !== undefined && value !== null && typeof value !== 'string') {
      throw new BadRequestException(`Expected string for ${key}`);
   }
}

/** After {@link assertString}: rejects strings longer than `max` (UTF-16 code units). */
export function assertStringMaxLength(value: unknown, key: string, max: number): void {
   assertString(value, key);
   if (typeof value === 'string' && value.length > max) {
      throw new BadRequestException(`${key} must be at most ${max} characters`);
   }
}

/** Wraps a validator; allows undefined/null (optional field). */
export function optional(validator: (value: unknown, key: string) => void): (value: unknown, key: string) => void {
   return (value: unknown, key: string) => {
      if (value === undefined || value === null) return;
      validator(value, key);
   };
}

/** Throws if value is not a valid UUID (when present). */
export function assertUuid(value: unknown, key: string): void {
   if (value === undefined || value === null) return;
   if (typeof value !== 'string' || !uuidValidate(value)) {
      throw new BadRequestException(`Expected UUID for ${key}`);
   }
}

/** Throws if value is not a valid Date or ISO string (when present). */
export function assertDate(value: unknown, key: string): void {
   if (value === undefined || value === null) return;
   if (value instanceof Date) return;
   if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return;
   }
   throw new BadRequestException(`Expected date for ${key}`);
}

/** Throws if value is not one of the enum values (when present). */
export function assertEnum<T extends Record<string, unknown>>(enumObj: T): (value: unknown, key: string) => void {
   const values = new Set(Object.values(enumObj));
   return (value: unknown, key: string) => {
      if (value === undefined || value === null) return;
      if (!values.has(value as T[keyof T])) {
         throw new BadRequestException(`Invalid value for ${key}`);
      }
   };
}

/** Throws if value is not a plain object (when present). Used for nested shapes like Reactions. */
export function assertPlainObject(value: unknown, key: string): void {
   if (value === undefined || value === null) return;
   if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException(`Expected object for ${key}`);
   }
}

/** Throws BadRequestException if value is not a boolean (when present). */
export function assertBoolean(value: unknown, key: string): void {
   if (value === undefined || value === null) return;
   if (typeof value !== 'boolean') {
      throw new BadRequestException(`Expected boolean for ${key}`);
   }
}

/** Throws BadRequestException if value is not a number (when present). */
export function assertNumber(value: unknown, key: string): void {
   if (value === undefined || value === null) return;
   if (typeof value !== 'number' || !isFinite(value)) {
      throw new BadRequestException(`Expected number for ${key}`);
   }
}

/** Throws BadRequestException if value is not an array of strings (when present). */
export function assertStringArray(value: unknown, key: string): void {
   if (value === undefined || value === null) return;
   if (!Array.isArray(value)) {
      throw new BadRequestException(`Expected array for ${key}`);
   }
   for (let i = 0; i < value.length; i++) {
      if (typeof value[i] !== 'string') {
         throw new BadRequestException(`Expected string at ${key}[${i}]`);
      }
   }
}

/** Validator that uses the related type's registered validators when present; otherwise plain object. */
export function assertNested(entityCtor: Function): (value: unknown, key: string) => void {
   return (value: unknown, key: string) => {
      if (value === undefined || value === null) return;
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
         throw new BadRequestException(`Expected object for ${key}`);
      }
      const map = getSanitizedValidators(entityCtor);
      if (map) {
         for (const [k, v] of Object.entries(map)) {
            const sub = (value as Record<string, unknown>)[k];
            v(sub);
         }
      }
   };
}

/** Throws if value is not an array of valid enum values (when present). */
export function assertEnumArray<T extends Record<string, unknown>>(enumObj: T): (value: unknown, key: string) => void {
   const values = new Set(Object.values(enumObj));
   return (value: unknown, key: string) => {
      if (value === undefined || value === null) return;
      if (!Array.isArray(value)) {
         throw new BadRequestException(`Expected array for ${key}`);
      }
      for (let i = 0; i < value.length; i++) {
         if (!values.has(value[i] as T[keyof T])) {
            throw new BadRequestException(`Invalid value at ${key}[${i}]`);
         }
      }
   };
}

/** Like assertNested but for array fields (e.g. ContentSection[]). Validates each element. */
export function assertNestedArray(entityCtor: Function): (value: unknown, key: string) => void {
   const elementValidator = assertNested(entityCtor);
   return (value: unknown, key: string) => {
      if (value === undefined || value === null) return;
      if (!Array.isArray(value)) {
         throw new BadRequestException(`Expected array for ${key}`);
      }
      for (let i = 0; i < value.length; i++) {
         elementValidator(value[i], `${key}[${i}]`);
      }
   };
}
