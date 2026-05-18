import { Injectable } from '@nestjs/common';
import { Jurisdiction } from './jurisdiction.model';
import { JurisdictionManagerBase } from './jurisdiction.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';

@Injectable()
export class JurisdictionManager extends JurisdictionManagerBase {
   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache:MemoryCache) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   // add any additions or overrides here
}