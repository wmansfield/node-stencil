import { Injectable } from '@nestjs/common';
import { Model, QueryFilter, ProjectionFields, UpdateWriteOpResult, UpdateQuery, SortOrder, QueryWithHelpers, Query, Connection } from 'mongoose';
import { MongoManagerBase } from './mongo-manager.base';
import { MongoConnectionProvider } from '../mongo/mongo-connection.provider';
import { ListResult } from '../types/data/list-result';
import { EntityRegistry } from 'src/entities/entity.registry';
import { DependencyCoordinator } from 'src/entities/dependencies/dependency-coordinator';
import { MemoryCache } from '../cache/memory-cache';
import { IMongoManagerIndexable, IMongoManagerIndexableIsolated } from './mongo-manager-indexable';

@Injectable()
export abstract class MongoManagerIsolated<T> extends MongoManagerBase<T> implements IMongoManagerIndexableIsolated {
   constructor(
      collectionName: string,
      primaryKeyField: keyof T,
      connectionProvider: MongoConnectionProvider,
      entities: EntityRegistry,
      dependencyCoordinator: DependencyCoordinator,
      protected memoryCache: MemoryCache
   ) {
      super(collectionName, primaryKeyField, connectionProvider, entities, dependencyCoordinator);
   }

   abstract ensureIndexes(route: string): Promise<void>;

   /** This should not be used directly by custom code, it is designed for aspect flexibility.  Code should use an _ underscore method here. */
   protected async getIsolatedConnection(tenant_code: string): Promise<Connection> {
      if (!tenant_code) {
         throw new Error('tenant_code required, but not provided');
      }
      return this.getConnection(tenant_code);
   }
   /** This should not be used directly by custom code, it is designed for aspect flexibility.  Code should use an _ underscore method here. */
   protected async getIsolatedModel(tenant_code: string): Promise<Model<T>> {
      if (!tenant_code) {
         throw new Error('tenant_code required, but not provided');
      }
      return await this.getModel(tenant_code);
   }

   protected async _retrieveIsolated<R = T>(
      ctor: new (...args: any[]) => R,
      tenant_code: string,
      id: string,
      projection: ProjectionFields<T>
   ): Promise<R | undefined> {
      const model = await this.getIsolatedModel(tenant_code);

      const doc = await model
         .findOne({ [this.primaryKeyField]: id } as QueryFilter<T>)
         .select(projection)
         .lean({ getters: true })
         .exec();
      if (!doc) return undefined;

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc as R;
   }

   protected async _findTenant<R = T>(
      ctor: new (...args: any[]) => R,
      tenant_code: string,
      filter: QueryFilter<T>,
      projection: ProjectionFields<T>,
      skip: number,
      take: number,
      sort?: { [key: string]: SortOrder } | [string, SortOrder][],
      includeTotal?: boolean
   ): Promise<ListResult<R>> {
      const model = await this.getModel(tenant_code);
      const filtered = model.find(filter);
      const docs = await this.fetchAsSteppedList(filtered, projection, skip, take, sort, includeTotal === undefined ? false : includeTotal);

      // zero-copy prototype
      docs.items = docs.items.map(doc => {
         Object.setPrototypeOf(doc, ctor.prototype);
         return doc;
      }) as any;

      return docs as unknown as ListResult<R>;
   }

   protected async _findIsolated<R = T>(
      ctor: new (...args: any[]) => R,
      tenant_code: string,
      filter: QueryFilter<T>,
      projection: ProjectionFields<T>,
      skip: number,
      take: number,
      sort?: { [key: string]: SortOrder } | [string, SortOrder][],
      includeTotal?: boolean
   ): Promise<ListResult<R>> {
      const model = await this.getIsolatedModel(tenant_code);
      const filtered = model.find(filter);
      const docs = await this.fetchAsSteppedList(filtered, projection, skip, take, sort, includeTotal === undefined ? true : includeTotal);

      // zero-copy prototype
      docs.items = docs.items.map(doc => {
         Object.setPrototypeOf(doc, ctor.prototype);
         return doc;
      }) as any;

      return docs as unknown as ListResult<R>;
   }
   protected async _findOneIsolated<R = T>(
      ctor: new (...args: any[]) => R,
      tenant_code: string,
      filter: QueryFilter<T>,
      projection: ProjectionFields<T>
   ): Promise<R | undefined> {
      const model = (await this.getIsolatedModel(tenant_code)) as Model<T>;
      const doc = await model.findOne(filter).select(projection).lean({ getters: true }).exec();

      if (!doc) return undefined;

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc as R;
   }

   protected async _insertIsolated(ctor: new (...args: any[]) => T, tenant_code: string, doc: T): Promise<T> {
      const model = await this.getIsolatedModel(tenant_code);

      await model.create(doc);

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc;
   }

   protected async _upsertIsolated(ctor: new (...args: any[]) => T, tenant_code: string, id: string, doc: T, unsetFields?: string[]): Promise<T> {
      const model = await this.getIsolatedModel(tenant_code);
      const filter = { [this.primaryKeyField]: id } as QueryFilter<T>;

      const updateQuery: UpdateQuery<T> = { $set: doc } as UpdateQuery<T>;
      if (unsetFields && unsetFields.length > 0) {
         const unset = {} as Record<string, 1>;
         unsetFields.forEach(field => {
            unset[field] = 1;
         });
         updateQuery.$unset = unset;
      }

      await model.findOneAndUpdate(filter, updateQuery, { upsert: true }).exec();

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc;
   }

   protected async _deleteIsolated(tenant_code: string, id: string): Promise<boolean> {
      const model = await this.getIsolatedModel(tenant_code);
      const filter = { [this.primaryKeyField]: id } as QueryFilter<T>;

      const result = await model.findOneAndDelete(filter).exec();
      return !!result;
   }

   protected async _updatePartialIsolated(jurisdiction_id: string, filter: QueryFilter<T>, update: UpdateQuery<T>): Promise<UpdateWriteOpResult> {
      const model = await this.getIsolatedModel(jurisdiction_id);
      const result = await model.updateOne(filter, update).exec();
      return result;
   }

   protected async _updatePartialRetrieveIsolated<R = T>(
      ctor: new (...args: any[]) => R,
      jurisdiction_id: string,
      filter: QueryFilter<T>,
      update: UpdateQuery<T>,
      projection: ProjectionFields<T>
   ): Promise<R | undefined> {
      const model = await this.getIsolatedModel(jurisdiction_id);
      const doc = await model.findOneAndUpdate(filter, update, { returnDocument: 'after' }).select(projection).lean({ getters: true }).exec();

      if (!doc) return undefined;

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc as R;
   }

   protected async _updateManyPartialIsolated(jurisdiction_id: string, filter: QueryFilter<T>, update: UpdateQuery<T>): Promise<UpdateWriteOpResult> {
      const model = await this.getIsolatedModel(jurisdiction_id);
      const result = await model.updateMany(filter, update).exec();
      return result;
   }
}
