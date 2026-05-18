import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigResolver } from 'src/config/config.resolver';
import { ConfigTemplates } from 'src/config/config.templates';
import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { RateLimitOptions } from './rate-limit.types';

type Limiter = RateLimiterRedis | RateLimiterMemory;

const REDIS_RECONNECT_INTERVAL_MS = 30_000;

@Injectable()
export class RateLimitService implements OnModuleInit, OnModuleDestroy {
   private readonly logger = new Logger(RateLimitService.name);
   private redisUrl: string | null = null;
   private redis: Redis | null = null;
   private redisHealthy = false;
   private reconnectTimer: ReturnType<typeof setInterval> | null = null;
   private redisLimiters = new Map<string, RateLimiterRedis>();
   private memoryLimiters = new Map<string, RateLimiterMemory>();

   constructor(private readonly configResolver: ConfigResolver) {}

   async onModuleInit(): Promise<void> {
      const url = await this.configResolver.getValue(ConfigTemplates.RedisUrl());
      if (url) {
         this.redisUrl = url;
         await this.connectRedis();
      } else {
         this.logger.debug('REDIS_URL not set, rate limiting will use in-memory store (per-instance only)');
      }
   }

   async onModuleDestroy(): Promise<void> {
      this.stopReconnectTimer();
      this.redisLimiters.clear();
      this.memoryLimiters.clear();
      if (this.redis) {
         await this.redis.quit();
         this.redis = null;
      }
   }

   /**
    * Consume one point for the given key. Throws (non-Error rejection) when over limit.
    * On Redis failure, transparently falls back to in-memory rate limiting and schedules
    * reconnection attempts. Rate limiting is always enforced — never fails open.
    */
   async consume(key: string, options: RateLimitOptions): Promise<{ remaining: number; msBeforeNext: number }> {
      if (this.redisHealthy) {
         try {
            const limiter = this.getRedisLimiter(options);
            const res = await limiter.consume(key);
            return { remaining: res.remainingPoints, msBeforeNext: res.msBeforeNext };
         } catch (rej) {
            if (rej instanceof Error) {
               this.logger.warn('Redis rate-limit error, falling back to in-memory', rej.message);
               this.onRedisFailure();
            } else {
               throw rej;
            }
         }
      }

      const memLimiter = this.getMemoryLimiter(options);
      const res = await memLimiter.consume(key);
      return { remaining: res.remainingPoints, msBeforeNext: res.msBeforeNext };
   }

   private async connectRedis(): Promise<void> {
      if (!this.redisUrl) return;

      try {
         if (this.redis) {
            await this.redis.quit().catch(() => {});
         }

         this.redis = new Redis(this.redisUrl, {
            enableOfflineQueue: false,
            lazyConnect: true,
            maxRetriesPerRequest: 2,
            retryStrategy: (times: number) => (times <= 2 ? 500 : null),
         });
         this.redis.on('error', (err: Error) => this.logger.warn('Redis rate-limit client error', err.message));

         await this.redis.connect();
         await this.redis.ping();
         this.redisHealthy = true;
         this.redisLimiters.clear();
         this.stopReconnectTimer();
         this.logger.log('Rate limit Redis connected');
      } catch (err) {
         this.logger.warn('Rate limit Redis unavailable, using in-memory fallback', (err as Error).message);
         this.redisHealthy = false;
         this.startReconnectTimer();
      }
   }

   private onRedisFailure(): void {
      this.redisHealthy = false;
      this.startReconnectTimer();
   }

   private startReconnectTimer(): void {
      if (this.reconnectTimer) return;
      this.reconnectTimer = setInterval(async () => {
         this.logger.debug('Attempting Redis rate-limit reconnection...');
         await this.connectRedis();
      }, REDIS_RECONNECT_INTERVAL_MS);
   }

   private stopReconnectTimer(): void {
      if (this.reconnectTimer) {
         clearInterval(this.reconnectTimer);
         this.reconnectTimer = null;
      }
   }

   private getRedisLimiter(options: RateLimitOptions): RateLimiterRedis {
      const cacheKey = `${options.points}:${options.duration}`;
      let limiter = this.redisLimiters.get(cacheKey);
      if (!limiter) {
         limiter = new RateLimiterRedis({
            storeClient: this.redis!,
            keyPrefix: 'rl',
            points: options.points,
            duration: options.duration,
         });
         this.redisLimiters.set(cacheKey, limiter);
      }
      return limiter;
   }

   private getMemoryLimiter(options: RateLimitOptions): RateLimiterMemory {
      const cacheKey = `${options.points}:${options.duration}`;
      let limiter = this.memoryLimiters.get(cacheKey);
      if (!limiter) {
         limiter = new RateLimiterMemory({
            keyPrefix: 'rl',
            points: options.points,
            duration: options.duration,
         });
         this.memoryLimiters.set(cacheKey, limiter);
      }
      return limiter;
   }
}
