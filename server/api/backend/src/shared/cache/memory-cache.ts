import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
   value: T;
   expiresAt: number;
}

interface CacheResult<T> {
   value: T;
   fromCache: boolean;
}

@Injectable()
export class MemoryCache {
   private cache = new Map<string, CacheEntry<any>>();
   private inflightFetches = new Map<string, Promise<any>>();
   private defaultTtlMs = 5 * 60 * 1000; // 5 minutes
   private readonly logger = new Logger(MemoryCache.name);

   get<T>(key: string): T | null {
      const entry = this.cache.get(key);
      if (!entry || entry.expiresAt < Date.now()) {
         this.cache.delete(key);
         return null;
      }
      return entry.value;
   }

   set<T>(key: string, value: T, ttlMs?: number): void {
      this.cache.set(key, {
         value,
         expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      });
   }

   async getOrFetch1<T>(key: string, fetchFn: () => Promise<T>): Promise<CacheResult<T>> {
      return await this.getOrFetch(1 * 60 * 1000, key, fetchFn);
   }
   async getOrFetch5<T>(key: string, fetchFn: () => Promise<T>): Promise<CacheResult<T>> {
      return await this.getOrFetch(5 * 60 * 1000, key, fetchFn);
   }
   async getOrFetch15<T>(key: string, fetchFn: () => Promise<T>): Promise<CacheResult<T>> {
      return await this.getOrFetch(15 * 60 * 1000, key, fetchFn);
   }
   private async getOrFetch<T>(ttlMs: number, key: string, fetchFn: () => Promise<T>): Promise<CacheResult<T>> {
      const cached = this.get<T>(key);
      if (cached) {
         return { value: cached, fromCache: true };
      }

      // Use a single function to register or reuse an in-flight promise atomically
      let fetchPromise = this.inflightFetches.get(key);
      if (!fetchPromise) {
         fetchPromise = (async () => {
            try {
               const result = await fetchFn();
               this.set(key, result, ttlMs);
               return result;
            } finally {
               this.inflightFetches.delete(key);
            }
         })();

         this.inflightFetches.set(key, fetchPromise); // atomic not required, while unlikely, double fetch will be allowed
      }

      const result = await fetchPromise;
      return { value: result, fromCache: false };
   }

   clear(key: string): void {
      this.cache.delete(key);
      this.inflightFetches.delete(key);
   }

   clearAll(): void {
      this.cache.clear();
      this.inflightFetches.clear();
   }

   cleanupExpired(): void {
      let count = 0;
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
         if (entry.expiresAt < now) {
            this.cache.delete(key);
            count++;
         }
      }

      if (count > 0) {
         this.logger.debug(`Cleaned up ${count} expired item(s)`);
      }
   }
}
