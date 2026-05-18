import { Injectable } from '@nestjs/common';
import { Widget } from './widget.model';
import { WidgetManagerBase } from './widget.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';

@Injectable()
export class WidgetManager extends WidgetManagerBase {
   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache:MemoryCache) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   // add any additions or overrides here
}