/**
 * Platform-wide system fields that persistence overwrites or sets.
 * Request bodies should not be able to set these; Sanitized<T> omits them at the type level
 * and SanitizedPipe strips them at runtime.
 */
export const SYSTEM_FIELDS = ['searchable', 'created_utc', 'updated_utc'] as const;
export type SystemFieldName = (typeof SYSTEM_FIELDS)[number];

/**
 * Entity shape with system fields omitted. Used internally by SanitizedPipe.
 * In generated code and controller signatures, use the entity type (Comment) so the design reads
 * "takes a Comment"; the pipe applies sanitization and validation without exposing DTO jargon.
 */
export type Sanitized<T> = Omit<T, SystemFieldName>;

/** Validator for a single field: throws (e.g. BadRequestException) if value is invalid. */
export type SanitizedValidator = (value: unknown) => void;

/** Map of allowed keys to validators. Defines allowlist (no extra keys) + type enforcement. */
export type SanitizedValidatorMap = Record<string, SanitizedValidator>;
