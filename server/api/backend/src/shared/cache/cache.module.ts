import { Global, Module } from '@nestjs/common';
import { MemoryCache } from './memory-cache';

@Global()
@Module({
   providers: [MemoryCache],
   exports: [MemoryCache],
})
export class CacheModule {}
