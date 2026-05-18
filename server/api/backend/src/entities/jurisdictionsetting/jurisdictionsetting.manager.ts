import { Injectable } from '@nestjs/common';
import { JurisdictionSetting } from './jurisdictionsetting.model';
import { JurisdictionSettingManagerBase } from './jurisdictionsetting.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';
import { isNullOrWhiteSpace } from 'src/shared/utils';

@Injectable()
export class JurisdictionSettingManager extends JurisdictionSettingManagerBase {
   constructor(
      connectionProvider: MongoConnectionProvider,
      entities: EntityRegistry,
      dependencyCoordinator: DependencyCoordinator,
      memoryCache: MemoryCache
   ) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async getValueOrDefaultStringArray(jurisdiction_id: string, name: string, default_value?: string[]): Promise<string[] | undefined> {
      const value = await this.getValueOrDefaultString(jurisdiction_id, name, '');
      if (!isNullOrWhiteSpace(value)) {
         return JSON.parse(value!) as string[];
      }
      return default_value;
   }
   async getValueOrDefaultStringArrayCached(jurisdiction_id: string, name: string, default_value?: string[]): Promise<string[] | undefined> {
      const cached = await this.memoryCache.getOrFetch15(`GlobalSettingManager:getValueOrDefaultStringArrayCached:${jurisdiction_id}:${name}`, () =>
         this.getValueOrDefaultStringArray(jurisdiction_id, name, default_value)
      );
      return cached.value;
   }

   async getValueOrDefaultString(jurisdiction_id: string, name: string, default_value?: string): Promise<string | undefined> {
      const result = await this.getById(jurisdiction_id, name);
      if (!isNullOrWhiteSpace(result?.value)) {
         return result!.value;
      }
      return default_value;
   }
   async getValueOrDefaultStringCached(jurisdiction_id: string, name: string, default_value: string): Promise<string | undefined> {
      const cached = await this.memoryCache.getOrFetch15(`GlobalSettingManager:getValueOrDefaultStringCached:${jurisdiction_id}:${name}`, () =>
         this.getValueOrDefaultString(jurisdiction_id, name, default_value)
      );
      return cached.value;
   }

   async getValueOrDefaultDate(jurisdiction_id: string, name: string, default_value?: Date): Promise<Date | undefined> {
      const result = await this.getById(jurisdiction_id, name);
      if (!isNullOrWhiteSpace(result?.value)) {
         return new Date(Date.parse(result!.value!));
      }
      return default_value;
   }

   async getValueOrDefaultInt(jurisdiction_id: string, name: string, default_value?: number): Promise<number | undefined> {
      const result = await this.getById(jurisdiction_id, name);
      if (!isNullOrWhiteSpace(result?.value)) {
         return parseInt(result!.value!);
      }
      return default_value;
   }

   async upsertInt(jurisdiction_id: string, name: string, value?: number): Promise<void> {
      const result = await this.getById(jurisdiction_id, name);
      if (result) {
         result.value = value !== undefined ? value.toString() : undefined;
         await this.replace(jurisdiction_id, result._id, result);
      } else {
         await this.insert(
            jurisdiction_id,
            new JurisdictionSetting({
               _id: name,
               jurisdiction_id: jurisdiction_id,
               value: value !== undefined ? value.toString() : undefined,
            })
         );
      }
   }

   async upsertDate(jurisdiction_id: string, name: string, value?: Date): Promise<void> {
      const result = await this.getById(jurisdiction_id, name);
      if (result) {
         result.value = value ? value.toISOString() : undefined;
         await this.replace(jurisdiction_id, result._id, result);
      } else {
         await this.insert(
            jurisdiction_id,
            new JurisdictionSetting({
               _id: name,
               jurisdiction_id: jurisdiction_id,
               value: value ? value.toISOString() : undefined,
            })
         );
      }
   }
}
