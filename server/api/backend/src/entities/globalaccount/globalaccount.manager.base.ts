import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MongoManagerShared } from 'src/shared/managers/mongo-manager.shared';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { GlobalAccount } from './globalaccount.model';
import { QueryFilter, ProjectionFields, SortOrder, UpdateQuery } from 'mongoose';
import type { Document } from 'bson';
import { COLLECTION_NAME, PRIMARY_KEY } from './globalaccount.schema';
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
export class GlobalAccountManagerBase extends MongoManagerShared<GlobalAccount> {
   protected readonly logger = new Logger(GlobalAccountManagerBase.name);

   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache: MemoryCache) {
      super(COLLECTION_NAME, PRIMARY_KEY, connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async validateExistence(_id:string | undefined) {
      if (!_id)
      {
         return;
      }const found = await this._retrieveShared<GlobalAccount>(GlobalAccount, _id, { _id: 1 });
      
      if (!found) {
         throw new UIException(LocalizableString.General_InvalidReference("GlobalAccount"));
      }
   }
   
   
   async anyWithJurisdiction(jurisdiction_id:string | undefined): Promise<boolean>{
      if (!jurisdiction_id){
         return false;
      }
      const filter: QueryFilter<GlobalAccount> = {
         jurisdiction_id: jurisdiction_id
      };

      const found = await this._findShared<GlobalAccount>(GlobalAccount, filter, { _id: 1 }, 0, 1, undefined, false);
      return found.items.length > 0;
   }
   

   async getById(_id: string): Promise<GlobalAccount | undefined> {
      const result = this._retrieveShared<GlobalAccount>(GlobalAccount, _id, GlobalAccount.Projection);
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
         const orFilter = BatchUtils.createOrFilter<GlobalAccount>(ids, '_id');
         const filter: QueryFilter<GlobalAccount> = {
            ...orFilter,
         };

         const result = await this._findShared<TProjection>(ctor, filter, projection, 0, MAX_INT_32);
         
         return result.items;
      });
      return result;
      
   }

   
   async getForAuthIdentifier(auth_identifier: string): Promise<GlobalAccount | undefined> {
      const filter: QueryFilter<GlobalAccount> = { auth_identifier: auth_identifier };
      const result = await this._findOneShared<GlobalAccount>(GlobalAccount, filter, GlobalAccount.Projection);
      return result;
   }
   

   async find(
      skip: number, 
      take: number,
      keyword?: string,
      order_by?: string, 
      descending: boolean = false,
      jurisdiction_id?: string
   ): Promise<ListResult<GlobalAccount>> {
      return await this.findAs<GlobalAccount>(
         GlobalAccount,
         GlobalAccount.Projection,
         skip, 
         take,
         keyword,
         order_by, 
         descending,
         jurisdiction_id
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
      jurisdiction_id?: string
   ): Promise<ListResult<TProjection>> {
      const filter: QueryFilter<GlobalAccount> = {
         
      };
      
      if(!isNullOrWhiteSpace(jurisdiction_id)) {
         filter.jurisdiction_id = jurisdiction_id;
      }
      
      if (!isNullOrWhiteSpace(keyword)) {
         // Escape special regex characters to treat them as literals
         const escapedKeyword = keyword!.toLowerCase().replace(/[+*?^${}()|[\]\\]/g, '\\$&');
         filter.searchable = { $regex: escapedKeyword, $options: 'i' };
      }
      
      const sorts = this.applySafeSort([{ field: order_by, descending}]);

      let result = await this._findShared<TProjection>(ctor, filter, projection, skip, take, sorts);
      
      result = await this.postProcessFindAs(result);

      return result;
   }

   
   async insert(document: GlobalAccount): Promise<GlobalAccount> {
      
      if (!document._id) {
         document._id = uuidv4();
      }
      
      document.created_utc = new Date();
      document.updated_utc = document.created_utc;

      await this.preProcessMutationDocument(document, DocumentOperation.insert);
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      await this._insertShared(GlobalAccount, document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.insert);
      await this.dependencyCoordinator.markInvalidated("GlobalAccount", document);

      return document;
   }

   async replace(_id: string, document: GlobalAccount): Promise<GlobalAccount> {
      
      document.updated_utc = new Date();

      await this.preProcessMutationDocument(document, DocumentOperation.replace);
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      
      const unset: string[] | undefined = undefined; // No nullable nested objects to remove

      await this._upsertShared(GlobalAccount, _id, document, unset);
      
      await this.postProcessMutationDocument(document, DocumentOperation.replace);
      await this.dependencyCoordinator.markInvalidated("GlobalAccount", document);

      return document;

   }

   

   async delete(document: GlobalAccount): Promise<boolean> {
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
      
      // auth
      match = indexes.find(x => x.name == "auth");
      if (!match)
      {
         const options = {
            unique: true,
            name: 'auth'
         };
         const fields = {
            auth_identifier: 1,
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

   protected determineRemovableFieldsDocument(document: GlobalAccount): string[] | undefined {
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

      const allowedFields = ['auth_identifier'];
      
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

   protected async sanitize(document: GlobalAccount) : Promise<void> {
      GlobalAccount.sanitize(document);
   }
   

   protected async validate(document: GlobalAccount): Promise<void> {
      // Fields
      
      if (!document._id || !uuidValidate(document._id)) {
         throw new UIException(LocalizableString.General_FieldRequired("globalaccount._id"));
      }
      
      if (isNullOrWhiteSpace(document.auth_identifier)) {
         throw new UIException(LocalizableString.General_FieldRequired("globalaccount.auth_identifier"));
      }
      
      if (isNullOrWhiteSpace(document.jurisdiction_id)) {
         throw new UIException(LocalizableString.General_FieldRequired("globalaccount.jurisdiction_id"));
      }
      
      if (document._id && document._id.length > 150) {
         throw new UIException(LocalizableString.General_FieldMaxLength(150, "globalaccount._id"));
      }
      
      if (document.auth_identifier && document.auth_identifier.length > 150) {
         throw new UIException(LocalizableString.General_FieldMaxLength(150, "globalaccount.auth_identifier"));
      }
      
      if (document.jurisdiction_id && document.jurisdiction_id.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "globalaccount.jurisdiction_id"));
      }
      
   }

   
   protected async calculateSearchable(document: GlobalAccount) : Promise<void> {
      document.searchable = SEARCHABLE_DIVIDER;
      
      if (!isNullOrWhiteSpace(document.auth_identifier)) {
         document.searchable += document.auth_identifier!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
   }
   

   protected async postProcessFindAs<TProjection>(data: ListResult<TProjection>) : Promise<ListResult<TProjection>> {
      return data;
   }
   protected async preProcessMutationDocument(document: GlobalAccount, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationDocument(document: GlobalAccount, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
}