import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { SYSTEM_FIELDS } from 'src/shared/types/sanitized.types';
import { getSanitizedValidators } from './sanitized.registry';

/**
 * Strips platform-wide system fields from the request body.
 * When used as SanitizedPipe.for(Entity), also enforces types and allowlist (no extra keys) via registered validators.
 *
 * In generated code and controller signatures, use the entity type (Comment) so the design reads "takes a Comment".
 * The pipe is implementation detail; no DTO type in the signature.
 *
 * Usage:
 *   @Body(SanitizedPipe.for(Comment)) input: Comment
 *
 * Validators are registered per entity (e.g. comment.sanitized.validators.ts). Generation can emit them.
 */
@Injectable()
export class SanitizedPipe implements PipeTransform {
   constructor(private readonly entity?: Function) {}

   static for(entity: Function): SanitizedPipe {
      return new SanitizedPipe(entity);
   }

   transform(value: any, _metadata: ArgumentMetadata): Record<string, unknown> {
      if (value == null || typeof value !== 'object') {
         return value;
      }
      const out = { ...value };
      for (const key of SYSTEM_FIELDS) {
         delete out[key];
      }

      const validators = this.entity ? getSanitizedValidators(this.entity) : undefined;
      if (this.entity && !validators) {
         throw new Error(
            `Sanitize.for(${this.entity.name}) used but no validators registered. Did you forget to import the .sanitized.validators file?`,
         );
      }
      if (validators) {
         const allowedKeys = new Set(Object.keys(validators));
         for (const key of Object.keys(out)) {
            if (!allowedKeys.has(key)) {
               throw new BadRequestException(`Unexpected property: ${key}`);
            }
            try {
               validators[key](out[key]);
            } catch (err) {
               if (err instanceof BadRequestException) throw err;
               throw new BadRequestException(`Invalid value for ${key}`);
            }
         }
      }

      // Restore class prototype if entity constructor is known.
      // NestJS's global ValidationPipe (transform: true) normally does this via
      // class-transformer's plainToInstance(). Since our pipe replaces that behavior,
      // we must reconstruct the instance so methods like asConfigPerspective() exist.
      //
      // Object.assign handles both cases:
      //  - Entity classes whose constructor copies init data (e.g. Legal) — assign is a no-op
      //  - Request-model marker classes with no constructor (e.g. CapsuleCreateRequest) —
      //    assign copies the validated data onto the otherwise-empty instance
      if (this.entity) {
         try {
            const instance = new (this.entity as any)(out);
            return Object.assign(instance, out);
         } catch {
            // If constructor fails (e.g. classOnly models without matching constructor),
            // fall back to the plain object — feature controllers don't need the prototype.
            return out;
         }
      }

      return out;
   }
}
