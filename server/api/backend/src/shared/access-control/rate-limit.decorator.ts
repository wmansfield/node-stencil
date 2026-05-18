import { SetMetadata } from '@nestjs/common';
import { RateLimitOptions } from './rate-limit.types';

export const RATE_LIMIT_KEY = 'rateLimit';
export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';

/**
 * Configures rate limiting for the handler.
 * When RateLimitGuard is registered as APP_GUARD, all routes get a default
 * limit of 120 req/min/user. Use this decorator to override with a tighter limit.
 *
 * @example
 * @RateLimit({ points: 60, duration: 60 })  // 60 requests per minute per user, per endpoint
 * @UseGuards(AuthGuard, RateLimitGuard)
 * @Post('create')
 * async create(...) {}
 */
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Exempts a handler or controller from rate limiting entirely.
 * Use sparingly — only for health checks or similar infrastructure endpoints.
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);
