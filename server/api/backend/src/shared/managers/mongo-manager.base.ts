import { Injectable } from '@nestjs/common';
import { Connection, Model, ProjectionFields, SortOrder } from 'mongoose';
import { MongoConnectionProvider } from '../mongo/mongo-connection.provider';
import { MAX_INT_32 } from '../constants/int';
import { ListResult } from '../types/data/list-result';
import { EntityRegistry } from 'src/entities/entity.registry';
import { DependencyCoordinator } from 'src/entities/dependencies/dependency-coordinator';
import ModelUtils from '../utils/model.utils';

@Injectable()
export abstract class MongoManagerBase<T> {
   constructor(
      public collectionName: string,
      protected primaryKeyField: keyof T,
      protected readonly connectionProvider: MongoConnectionProvider,
      protected entities: EntityRegistry,
      protected dependencyCoordinator: DependencyCoordinator
   ) {}

   defaultAgent: string;

   protected async getConnection(tenant_code: string): Promise<Connection> {
      return await this.connectionProvider.getTenantConnection(tenant_code);
   }
   protected async getModel(tenant_code: string): Promise<Model<T>> {
      const connection = await this.getConnection(tenant_code);
      return connection.model<T>(this.collectionName);
   }

   protected async fetchAsSteppedList<R = T>(
      filteredQuery: any,
      projection: ProjectionFields<T>,
      skip: number,
      take: number,
      sort?: { [key: string]: SortOrder } | [string, SortOrder][],
      includeTotal: boolean = true
   ): Promise<ListResult<R>> {
      if (take > MAX_INT_32) {
         take = MAX_INT_32; // sanity
      }

      let data: R[] = [];

      let takePlus = take;

      if (take < MAX_INT_32) {
         takePlus++;
      }

      let dataQuery: any;
      if (takePlus == MAX_INT_32 && skip == 0) {
         dataQuery = filteredQuery.clone().sort(sort).select(projection).lean({ getters: true });
         data = await dataQuery.exec() as R[];
      } else {
         dataQuery = filteredQuery.clone().sort(sort).skip(skip).limit(takePlus).select(projection).lean({ getters: true });
         data = await dataQuery.exec() as R[];
      }

      let total = 0;
      if (includeTotal) {
         const model = filteredQuery.model;
         const filter = dataQuery.getFilter();
         total = await model.countDocuments(filter as any).exec();
      }

      return ModelUtils.toSteppedList(data, skip, take, total);
   }
}
