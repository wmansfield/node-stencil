import { Injectable } from '@nestjs/common';
import { Model, QueryFilter, ProjectionFields, UpdateWriteOpResult, UpdateQuery, SortOrder, Connection } from 'mongoose';
import { MongoManagerBase } from './mongo-manager.base';
import { MongoConnectionProvider } from '../mongo/mongo-connection.provider';
import { ListResult } from '../types/data/list-result';
import { EntityRegistry } from 'src/entities/entity.registry';
import { DependencyCoordinator } from 'src/entities/dependencies/dependency-coordinator';
import { SHARED_TENANT_CODE } from '../constants/tenants';
import { MemoryCache } from '../cache/memory-cache';
import { IMongoManagerIndexable } from './mongo-manager-indexable';

@Injectable()
export abstract class MongoManagerShared<T> extends MongoManagerBase<T> implements IMongoManagerIndexable {
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

   abstract ensureIndexes(): Promise<void>;

   /** This should not be used directly by custom code, it is designed for aspect flexibility.  Code should use an _ underscore method here. */
   protected async getSharedConnection(): Promise<Connection> {
      return this.getConnection(SHARED_TENANT_CODE);
   }

   /** This should not be used directly by custom code, it is designed for aspect flexibility.  Code should use an _ underscore method here. */
   protected async getSharedModel(): Promise<Model<T>> {
      return this.getModel(SHARED_TENANT_CODE);
   }

   protected async _retrieveShared<R = T>(ctor: new (...args: any[]) => R, id: string, projection: ProjectionFields<T>): Promise<R | undefined> {
      const model = await this.getSharedModel();
      const doc = await model
         .findOne({ [this.primaryKeyField]: id } as QueryFilter<T>)
         .select(projection)
         .lean({ getters: true })
         .exec();

      if (!doc) return undefined;

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc as R;
   }

   protected async _findShared<R = T>(
      ctor: new (...args: any[]) => R,
      filter: QueryFilter<T>,
      projection: ProjectionFields<T>,
      skip: number,
      take: number,
      sort?: { [key: string]: SortOrder } | [string, SortOrder][],
      includeTotal?: boolean
   ): Promise<ListResult<R>> {
      const model = await this.getSharedModel();
      const filtered = model.find(filter);
      const docs = await this.fetchAsSteppedList(filtered, projection, skip, take, sort, includeTotal === undefined ? true : includeTotal);

      docs.items = docs.items.map(doc => {
         Object.setPrototypeOf(doc, ctor.prototype);
         return doc;
      }) as any;

      return docs as unknown as ListResult<R>;
   }

   protected async _findOneShared<R = T>(
      ctor: new (...args: any[]) => R,
      filter: QueryFilter<T>,
      projection: ProjectionFields<T>
   ): Promise<R | undefined> {
      const model = await this.getSharedModel();
      const doc = await model.findOne(filter).select(projection).lean({ getters: true }).exec();

      if (!doc) return undefined;

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc as R;
   }

   protected async _insertShared(ctor: new (...args: any[]) => T, doc: T): Promise<T> {
      const model = await this.getSharedModel();
      await model.create(doc);

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc;
   }

   protected async _upsertShared(ctor: new (...args: any[]) => T, id: string, doc: T, unsetFields?: string[]): Promise<T> {
      const model = await this.getSharedModel();
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

   protected async _updatePartialShared(filter: QueryFilter<T>, update: UpdateQuery<T>): Promise<UpdateWriteOpResult> {
      const model = await this.getSharedModel();
      const result = await model.updateOne(filter, update).exec();
      return result;
   }
   protected async _updatePartialRetrieveShared<R = T>(
      ctor: new (...args: any[]) => R,
      filter: QueryFilter<T>,
      update: UpdateQuery<T>,
      projection: ProjectionFields<T>
   ): Promise<R | undefined> {
      const model = await this.getSharedModel();
      const doc = await model.findOneAndUpdate(filter, update, { returnDocument: 'after' }).select(projection).lean({ getters: true }).exec();

      if (!doc) return undefined;

      Object.setPrototypeOf(doc, ctor.prototype);
      return doc as R;
   }

   protected async _updateManyPartialShared(filter: QueryFilter<T>, update: UpdateQuery<T>): Promise<UpdateWriteOpResult> {
      const model = await this.getSharedModel();
      const result = await model.updateMany(filter, update).exec();
      return result;
   }

   protected async _deleteShared(id: string): Promise<boolean> {
      const model = await this.getSharedModel();
      const filter = { [this.primaryKeyField]: id } as QueryFilter<T>;

      const result = await model.findOneAndDelete(filter).exec();
      return !!result;
   }
}
