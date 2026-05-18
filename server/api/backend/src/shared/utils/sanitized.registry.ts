import { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';

const registry = new Map<Function, SanitizedValidatorMap>();

export function registerSanitizedValidators(entity: Function, validators: SanitizedValidatorMap): void {
   registry.set(entity, validators);
}

export function getSanitizedValidators(entity: Function): SanitizedValidatorMap | undefined {
   return registry.get(entity);
}
