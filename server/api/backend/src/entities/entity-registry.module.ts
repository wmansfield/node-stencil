import { Global, Module } from '@nestjs/common';
import { EntityRegistry } from './entity.registry';

@Global()
@Module({
   providers: [EntityRegistry],
   exports: [EntityRegistry],
})
export class EntityRegistryModule {}
