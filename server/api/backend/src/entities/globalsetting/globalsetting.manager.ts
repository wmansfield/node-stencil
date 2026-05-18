import { Global, Injectable } from '@nestjs/common';
import { GlobalSetting } from './globalsetting.model';
import { GlobalSettingManagerBase } from './globalsetting.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';
import { isNullOrWhiteSpace } from 'src/shared/utils/string.utils';

@Injectable()
export class GlobalSettingManager extends GlobalSettingManagerBase {
   constructor(
      connectionProvider: MongoConnectionProvider,
      entities: EntityRegistry,
      dependencyCoordinator: DependencyCoordinator,
      memoryCache: MemoryCache
   ) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async getValueOrDefaultStringArray(name: string, default_value?: string[]): Promise<string[] | undefined> {
      const value = await this.getValueOrDefaultString(name, '');
      if (!isNullOrWhiteSpace(value)) {
         return JSON.parse(value!) as string[];
      }
      return default_value;
   }
   async getValueOrDefaultStringArrayCached(name: string, default_value?: string[]): Promise<string[] | undefined> {
      const cached = await this.memoryCache.getOrFetch15(`GlobalSettingManager:getValueOrDefaultStringArrayCached:${name}`, () =>
         this.getValueOrDefaultStringArray(name, default_value)
      );
      return cached.value;
   }

   async getValueOrDefaultString(name: string, default_value?: string): Promise<string | undefined> {
      const result = await this.getById(name);
      if (result?.value && !isNullOrWhiteSpace(result?.value)) {
         return result.value;
      }
      return default_value;
   }
   async getValueOrDefaultStringCached(name: string, default_value: string): Promise<string> {
      const cached = await this.memoryCache.getOrFetch15(`GlobalSettingManager:getValueOrDefaultStringCached:${name}`, () =>
         this.getValueOrDefaultString(name, default_value)
      );
      return cached.value || default_value;
   }

   async getValueOrDefaultInt(name: string, default_value?: number): Promise<number | undefined> {
      const result = await this.getById(name);
      if (!isNullOrWhiteSpace(result?.value)) {
         return parseInt(result!.value!);
      }
      return default_value;
   }

   async getValueOrDefaultIntCached(name: string, default_value: number): Promise<number> {
      const cached = await this.memoryCache.getOrFetch15(`GlobalSettingManager:getValueOrDefaultIntCached:${name}`, () =>
         this.getValueOrDefaultInt(name, default_value)
      );
      return cached.value || default_value;
   }

   async getValueOrDefaultDate(name: string, default_value?: Date): Promise<Date | undefined> {
      const result = await this.getById(name);
      if (!isNullOrWhiteSpace(result?.value)) {
         return new Date(Date.parse(result!.value!));
      }
      return default_value;
   }

   async upsertInt(name: string, value?: number): Promise<void> {
      const result = await this.getById(name);
      if (result) {
         result.value = value !== undefined ? value.toString() : undefined;
         await this.replace(result._id, result);
      } else {
         await this.insert(
            new GlobalSetting({
               _id: name,
               value: value !== undefined ? value.toString() : undefined,
            })
         );
      }
   }

   async upsertDate(name: string, value?: Date): Promise<void> {
      const result = await this.getById(name);
      if (result) {
         result.value = value ? value.toISOString() : undefined;
         await this.replace(result._id, result);
      } else {
         await this.insert(
            new GlobalSetting({
               _id: name,
               value: value ? value.toISOString() : undefined,
            })
         );
      }
   }
}
