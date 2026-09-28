import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigResolver } from 'src/config/config.resolver';
import { ConfigTemplates } from 'src/config/config.templates';

const KEY_PREFIX = 'mcp:jti:';
const MEMORY_PRUNE_THRESHOLD = 10_000;

/**
 * Single-use enforcement for identity assertion ids (`jti`). Uses Redis when REDIS_URL is set so
 * every instance shares one view; otherwise, or while Redis is failing, an in-memory set
 * (per-instance). Never fails open: an assertion is accepted only if this store records it first.
 */
@Injectable()
export class McpReplayStore implements OnModuleInit, OnModuleDestroy {
   private readonly logger = new Logger(McpReplayStore.name);
   private redis: Redis | null = null;
   private readonly memory = new Map<string, number>();

   constructor(private readonly configResolver: ConfigResolver) {}

   async onModuleInit(): Promise<void> {
      const url = await this.configResolver.getValue(ConfigTemplates.RedisUrl());
      if (!url) {
         return;
      }
      this.redis = new Redis(url, { enableOfflineQueue: false, lazyConnect: true, maxRetriesPerRequest: 2 });
      this.redis.on('error', (err: Error) => this.logger.warn('Redis replay-store client error', err.message));
      try {
         await this.redis.connect();
      } catch (err) {
         this.logger.warn('Redis replay store unavailable, using in-memory fallback', (err as Error).message);
      }
   }

   async onModuleDestroy(): Promise<void> {
      if (this.redis) {
         await this.redis.quit().catch(() => undefined);
         this.redis = null;
      }
   }

   /** Records `jti` until `expiresAtMs`. Returns false if it was already recorded. */
   async claim(jti: string, expiresAtMs: number): Promise<boolean> {
      const ttlMs = Math.max(1, expiresAtMs - Date.now());
      if (this.redis?.status === 'ready') {
         try {
            const result = await this.redis.set(`${KEY_PREFIX}${jti}`, '1', 'PX', ttlMs, 'NX');
            return result === 'OK';
         } catch (err) {
            this.logger.warn('Redis replay-store error, using in-memory fallback', (err as Error).message);
         }
      }
      return this.claimInMemory(jti, expiresAtMs);
   }

   private claimInMemory(jti: string, expiresAtMs: number): boolean {
      const now = Date.now();
      if (this.memory.size > MEMORY_PRUNE_THRESHOLD) {
         for (const [key, expires] of this.memory) {
            if (expires <= now) {
               this.memory.delete(key);
            }
         }
      }
      const existing = this.memory.get(jti);
      if (existing !== undefined && existing > now) {
         return false;
      }
      this.memory.set(jti, expiresAtMs);
      return true;
   }
}
