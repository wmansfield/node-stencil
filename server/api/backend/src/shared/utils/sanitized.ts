import { SanitizedPipe } from './sanitized.pipe';

/**
 * Unified API for body sanitization, keyed by entity.
 * Replace flow uses DSL-generated Entity.copyFromPartial(input, existing) instead.
 *
 * Usage:
 *   @Body(Sanitize.for(Comment)) input: Comment
 *   Comment.copyFromPartial(input, existing)
 *
 * For endpoints that intentionally bypass sanitization (e.g. third-party webhooks):
 *   @Body(Sanitize.ignore()) input: WebhookPayload
 */
export const Sanitize = {
   /** Pipe for @Body: validates and strips system fields. */
   for: (entity: Function) => SanitizedPipe.for(entity),

   /** Marks a @Body() as intentionally unsanitized. Strips system fields only, no field validation. */
   ignore: () => new SanitizedPipe(),
} as const;
