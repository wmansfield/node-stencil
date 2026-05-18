import {
   Injectable,
   CanActivate,
   ExecutionContext,
   HttpException,
   HttpStatus,
   Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { RATE_LIMIT_KEY, SKIP_RATE_LIMIT_KEY } from './rate-limit.decorator';
import { RateLimitOptions } from './rate-limit.types';
import { RateLimitService } from './rate-limit.service';
import { StencilRequest } from '../types/auth.types';

const DEFAULT_RATE_LIMIT: RateLimitOptions = { points: 120, duration: 60 };

/** Thrown when the user has exceeded the rate limit (429). Retry-After is set on the response before throwing. */
export class RateLimitExceededException extends HttpException {
   constructor(message = 'Too many requests', msBeforeNext?: number) {
      super(
         { message, retryAfterSeconds: msBeforeNext != null ? Math.ceil(msBeforeNext / 1000) : undefined },
         HttpStatus.TOO_MANY_REQUESTS
      );
   }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
   private readonly logger = new Logger(RateLimitGuard.name);

   constructor(
      private readonly reflector: Reflector,
      private readonly rateLimitService: RateLimitService
   ) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<StencilRequest>();
      const response = context.switchToHttp().getResponse<Response>();

      if (request.method === 'OPTIONS') {
         return true;
      }

      // Prevent double-consumption when registered as both APP_GUARD and per-method guard
      if ((request as any)._rateLimitApplied) {
         return true;
      }

      const skip = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_RATE_LIMIT_KEY, [
         context.getHandler(),
         context.getClass(),
      ]);
      if (skip) {
         return true;
      }

      const explicit = this.reflector.get<RateLimitOptions | undefined>(RATE_LIMIT_KEY, context.getHandler());
      const options = explicit ?? DEFAULT_RATE_LIMIT;

      const sub = request.auth?.payload?.sub;
      // Behind Cloudflare: CF-Connecting-IP is the real client IP (set/overwritten by CF, not spoofable).
      // Falls back to X-Forwarded-For first entry, then request.ip for non-CF environments (local dev).
      const cfIp = request.headers['cf-connecting-ip'] as string | undefined;
      const xff = (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
      const ip = cfIp || xff || request.ip || request.socket?.remoteAddress || 'unknown';
      const identity = sub ?? `ip:${ip}`;

      const keyPrefix = options.keyPrefix ?? `${request.method}:${request.path}`;
      const key = `${keyPrefix}:${identity}`;

      try {
         const { remaining, msBeforeNext } = await this.rateLimitService.consume(key, options);
         this.setRateLimitHeaders(response, options, remaining, msBeforeNext);
         (request as any)._rateLimitApplied = true;
         return true;
      } catch (rej) {
         if (rej instanceof Error) {
            throw rej;
         }
         const msBeforeNext =
            typeof (rej as { msBeforeNext?: number }).msBeforeNext === 'number'
               ? (rej as { msBeforeNext: number }).msBeforeNext
               : 0;
         this.setRateLimitHeaders(response, options, 0, msBeforeNext);
         throw new RateLimitExceededException('Too many requests', msBeforeNext);
      }
   }

   private setRateLimitHeaders(
      res: Response,
      options: RateLimitOptions,
      remaining: number,
      msBeforeNext: number
   ): void {
      res.setHeader('X-RateLimit-Limit', String(options.points));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
      if (msBeforeNext > 0) {
         res.setHeader('Retry-After', String(Math.ceil(msBeforeNext / 1000)));
      }
   }
}
