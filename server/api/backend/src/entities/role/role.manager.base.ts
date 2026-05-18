import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MongoManagerShared } from 'src/shared/managers/mongo-manager.shared';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { Role } from './role.model';
import { QueryFilter, ProjectionFields, SortOrder, UpdateQuery } from 'mongoose';
import type { Document } from 'bson';
import { COLLECTION_NAME, PRIMARY_KEY } from './role.schema';
import { v4 as uuidv4 } from 'uuid';
import { isNullOrWhiteSpace, sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
import { SEARCHABLE_DIVIDER } from 'src/shared/mongo';
import { UIException } from 'src/shared/exceptions/friendly-exception';
import { LocalizableString } from 'src/shared/types/i18n/localizable-string';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { DocumentOperation } from '../common/document-operation';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ListResult } from 'src/shared/types/data/list-result';
import { SortInfo } from 'src/shared/types/data/sort-info';
import { MAX_INT_32 } from 'src/shared/constants/int';
import { validate as uuidValidate } from 'uuid';
import { MemoryCache } from 'src/shared/cache/memory-cache';
import { BatchUtils } from 'src/shared/utils';


@Injectable()
export class RoleManagerBase extends MongoManagerShared<Role> {
   protected readonly logger = new Logger(RoleManagerBase.name);

   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache: MemoryCache) {
      super(COLLECTION_NAME, PRIMARY_KEY, connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async validateExistence(_id:string | undefined) {
      if (!_id)
      {
         return;
      }const found = await this._retrieveShared<Role>(Role, _id, { _id: 1 });
      
      if (!found) {
         throw new UIException(LocalizableString.General_InvalidReference("Role"));
      }
   }
   
   

   async getById(_id: string): Promise<Role | undefined> {
      const result = this._retrieveShared<Role>(Role, _id, Role.Projection);
      return result;
   }
   

   async getWithin<TProjection>(
      ctor: new (...args: any[]) => TProjection, 
      projection: ProjectionFields<TProjection>,
      ids: string[]
   ): Promise<TProjection[]> {
      if (!ids || ids.length === 0) {
         return [];
      }

      const result = BatchUtils.getWithinBuffered(ids, async (ids: string[]): Promise<TProjection[]> => {
         const orFilter = BatchUtils.createOrFilter<Role>(ids, '_id');
         const filter: QueryFilter<Role> = {
            ...orFilter,
         };

         const result = await this._findShared<TProjection>(ctor, filter, projection, 0, MAX_INT_32);
         
         return result.items;
      });
      return result;
      
   }

   

   async find(
      skip: number, 
      take: number,
      keyword?: string,
      order_by?: string, 
      descending: boolean = false,
      role_name?: string
   ): Promise<ListResult<Role>> {
      return await this.findAs<Role>(
         Role,
         Role.Projection,
         skip, 
         take,
         keyword,
         order_by, 
         descending,
         role_name
      );
   }
   

   protected async findAs<TProjection>(
      ctor: new (...args: any[]) => TProjection, 
      projection: ProjectionFields<TProjection>,
      skip: number, 
      take: number,
      keyword?: string,
      order_by?: string, 
      descending: boolean = false,
      role_name?: string
   ): Promise<ListResult<TProjection>> {
      const filter: QueryFilter<Role> = {
         
      };
      
      if (!isNullOrWhiteSpace(keyword)) {
         // Escape special regex characters to treat them as literals
         const escapedKeyword = keyword!.toLowerCase().replace(/[+*?^${}()|[\]\\]/g, '\\$&');
         filter.searchable = { $regex: escapedKeyword, $options: 'i' };
      }
      
      if(!isNullOrWhiteSpace(role_name)) {
         filter.role_name = role_name;
      }
      
      const sorts = this.applySafeSort([{ field: order_by, descending}]);

      let result = await this._findShared<TProjection>(ctor, filter, projection, skip, take, sorts);
      
      result = await this.postProcessFindAs(result);

      return result;
   }

   
   async insert(document: Role): Promise<Role> {
      
      if (!document._id) {
         document._id = uuidv4();
      }
      
      // ID Alias
      document.role_name = document._id;
      
      document.created_utc = new Date();
      document.updated_utc = document.created_utc;

      await this.preProcessMutationDocument(document, DocumentOperation.insert);
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      await this._insertShared(Role, document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.insert);
      await this.dependencyCoordinator.markInvalidated("Role", document);

      return document;
   }

   async replace(_id: string, document: Role): Promise<Role> {
      
      // ID Alias
      document.role_name = document._id;
      
      document.updated_utc = new Date();

      await this.preProcessMutationDocument(document, DocumentOperation.replace);
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      
      const unset: string[] | undefined = undefined; // No nullable nested objects to remove

      await this._upsertShared(Role, _id, document, unset);
      
      await this.postProcessMutationDocument(document, DocumentOperation.replace);
      await this.dependencyCoordinator.markInvalidated("Role", document);

      return document;

   }

   

   async delete(document: Role): Promise<boolean> {
      await this.preProcessMutationDocument(document, DocumentOperation.delete);
      
      // Get Server version
      const actual = await this.getById(document._id);
      if (actual == undefined) {
         return true;
      }
      
      const result = await this._deleteShared(actual._id);
      if (result) {
         await this.postProcessMutationDocument(actual, DocumentOperation.delete);
      }
      
      return result;
   }
   

   async ensureIndexes(): Promise<void> {
      const connection = await this.getSharedConnection();
      const existing = await connection.db!.listCollections({ name: this.collectionName }).toArray();
      if (existing.length == 0){
         return; // doesn't exist yet
      }
      
      const model = await this.getSharedModel();
      const collection = model.db.collection(this.collectionName);
      const indexes = await collection.indexes();

      let match:Document | undefined = undefined;
      
      // name
      match = indexes.find(x => x.name == "name");
      if (!match)
      {
         const options = {
            unique: true,
            name: 'name'
         };
         const fields = {
            role_name: 1,
         };
         await collection.createIndex(fields, options);
      }
      
      // default_searchable
      match = indexes.find(x => x.name == "default_searchable_en_v1");
      if (match == null)
      {
         const options = {
            unique: false,
            name: 'default_searchable_en_v1',
            collation: {
               locale: 'en',
               strength: 1    // Case-insensitive, diacritic-insensitive
            }
         };
         const fields = {
            
            searchable: 1,
         };
         await collection.createIndex(fields, options);
      }
      
   }

   protected determineRemovableFieldsDocument(document: Role): string[] | undefined {
      if (!document){
         return; // sanity
      }
      const fieldsToRemove:string[] = [];
      
      return fieldsToRemove;
   }

   /**
    * Only allow sorting by known indexed fields
    */
   protected applySafeSort(sorts:SortInfo[]) : [string, SortOrder][] {
      const result: [string, SortOrder][] = [];

      const allowedFields = ['role_name'];
      
      for (const item of sorts) {
         if (!isNullOrWhiteSpace(item.field)) {
            if (allowedFields.includes(item.field!)) {
               result.push([item.field!, item.descending === true ? 'desc' : 'asc']);
            }
         }
      }
      if (result.length === 0) {
         result.push(['_id', 'asc']);
      }

      return result;
   }

   protected async sanitize(document: Role) : Promise<void> {
      Role.sanitize(document);
   }
   

   protected async validate(document: Role): Promise<void> {
      // Fields
      
      if (isNullOrWhiteSpace(document._id)) {
         throw new UIException(LocalizableString.General_FieldRequired("role._id"));
      }
      
      if (isNullOrWhiteSpace(document.role_name)) {
         throw new UIException(LocalizableString.General_FieldRequired("role.role_name"));
      }
      
      if (document._id && document._id.length > 100) {
         throw new UIException(LocalizableString.General_FieldMaxLength(100, "role._id"));
      }
      
      if (document.role_name && document.role_name.length > 100) {
         throw new UIException(LocalizableString.General_FieldMaxLength(100, "role.role_name"));
      }
      
   }

   
   protected async calculateSearchable(document: Role) : Promise<void> {
      document.searchable = SEARCHABLE_DIVIDER;
      
      if (!isNullOrWhiteSpace(document.role_name)) {
         document.searchable += document.role_name!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
   }
   

   protected async postProcessFindAs<TProjection>(data: ListResult<TProjection>) : Promise<ListResult<TProjection>> {
      return data;
   }
   protected async preProcessMutationDocument(document: Role, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationDocument(document: Role, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
}