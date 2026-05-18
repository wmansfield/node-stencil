/**
 * Options for the @RateLimit() decorator.
 * Applied per endpoint; each endpoint can have its own points/duration.
 */
export interface RateLimitOptions {
   /** Number of requests allowed in the window */
   points: number;
   /** Window duration in seconds */
   duration: number;
   /** Optional bucket key prefix. If omitted, derived from method + path so each endpoint has its own bucket. */
   keyPrefix?: string;
}
