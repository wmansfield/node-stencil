import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MemoryCache } from 'src/shared/cache/memory-cache';

@Injectable()
export class CacheCleanupService implements OnModuleInit, OnModuleDestroy {
   private cleanupInterval: NodeJS.Timeout | null = null;

   constructor(private readonly memoryCache: MemoryCache) {}

   onModuleInit() {
      // Use native setInterval so this runs on ALL instances (API and Tasks)
      // regardless of whether ScheduleModule is loaded
      this.cleanupInterval = setInterval(() => {
         this.memoryCache.cleanupExpired();
      }, 1 * 60 * 1000); // Every 1 minute

      console.log('[CacheCleanupService] Started cache cleanup interval');
   }

   onModuleDestroy() {
      if (this.cleanupInterval) {
         clearInterval(this.cleanupInterval);
         this.cleanupInterval = null;
         console.log('[CacheCleanupService] Stopped cache cleanup interval');
      }
   }
}
