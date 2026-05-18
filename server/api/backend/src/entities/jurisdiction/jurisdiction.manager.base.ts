import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MongoManagerShared } from 'src/shared/managers/mongo-manager.shared';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { Jurisdiction } from './jurisdiction.model';
import { QueryFilter, ProjectionFields, SortOrder, UpdateQuery } from 'mongoose';
import type { Document } from 'bson';
import { COLLECTION_NAME, PRIMARY_KEY } from './jurisdiction.schema';
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
export class JurisdictionManagerBase extends MongoManagerShared<Jurisdiction> {
   protected readonly logger = new Logger(JurisdictionManagerBase.name);

   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache: MemoryCache) {
      super(COLLECTION_NAME, PRIMARY_KEY, connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async validateExistence(_id:string) {
      const found = await this._retrieveShared<Jurisdiction>(Jurisdiction, _id, { _id: 1 });
      
      if (!found) {
         throw new UIException(LocalizableString.General_InvalidReference("Jurisdiction"));
      }
   }
   
   

   async getById(_id: string): Promise<Jurisdiction | undefined> {
      const result = this._retrieveShared<Jurisdiction>(Jurisdiction, _id, Jurisdiction.Projection);
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
         const orFilter = BatchUtils.createOrFilter<Jurisdiction>(ids, '_id');
         const filter: QueryFilter<Jurisdiction> = {
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
      jurisdiction_id?: string
   ): Promise<ListResult<Jurisdiction>> {
      return await this.findAs<Jurisdiction>(
         Jurisdiction,
         Jurisdiction.Projection,
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
      const filter: QueryFilter<Jurisdiction> = {
         
      };
      
      if (!isNullOrWhiteSpace(keyword)) {
         // Escape special regex characters to treat them as literals
         const escapedKeyword = keyword!.toLowerCase().replace(/[+*?^${}()|[\]\\]/g, '\\$&');
         filter.searchable = { $regex: escapedKeyword, $options: 'i' };
      }
      
      if(!isNullOrWhiteSpace(jurisdiction_id)) {
         filter.jurisdiction_id = jurisdiction_id;
      }
      
      const sorts = this.applySafeSort([{ field: order_by, descending}]);

      let result = await this._findShared<TProjection>(ctor, filter, projection, skip, take, sorts);
      
      result = await this.postProcessFindAs(result);

      return result;
   }

   
   async insert(document: Jurisdiction): Promise<Jurisdiction> {
      
      if (!document._id) {
         document._id = uuidv4();
      }
      
      // ID Alias
      document.jurisdiction_id = document._id;
      
      document.created_utc = new Date();
      document.updated_utc = document.created_utc;

      await this.preProcessMutationDocument(document, DocumentOperation.insert);
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      await this._insertShared(Jurisdiction, document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.insert);
      await this.dependencyCoordinator.markInvalidated("Jurisdiction", document);

      return document;
   }

   async replace(_id: string, document: Jurisdiction): Promise<Jurisdiction> {
      
      // ID Alias
      document.jurisdiction_id = document._id;
      
      document.updated_utc = new Date();

      await this.preProcessMutationDocument(document, DocumentOperation.replace);
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      
      const unset: string[] | undefined = undefined; // No nullable nested objects to remove

      await this._upsertShared(Jurisdiction, _id, document, unset);
      
      await this.postProcessMutationDocument(document, DocumentOperation.replace);
      await this.dependencyCoordinator.markInvalidated("Jurisdiction", document);

      return document;

   }

   

   async delete(document: Jurisdiction, force: boolean = false): Promise<boolean> {
      await this.preProcessMutationDocument(document, DocumentOperation.delete);
      
      // Get Server version
      const actual = await this.getById(document._id);
      if (actual == undefined) {
         return true;
      }
      
      if (!force){
         await this.validateNoReferences(actual._id);
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

   protected determineRemovableFieldsDocument(document: Jurisdiction): string[] | undefined {
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

      const allowedFields = ['jurisdiction_id'];
      
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

   protected async sanitize(document: Jurisdiction) : Promise<void> {
      Jurisdiction.sanitize(document);
   }
   

   protected async validate(document: Jurisdiction): Promise<void> {
      // Fields
      
      if (isNullOrWhiteSpace(document._id)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdiction._id"));
      }
      
      if (isNullOrWhiteSpace(document.jurisdiction_id)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdiction.jurisdiction_id"));
      }
      
      if (document._id && document._id.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "jurisdiction._id"));
      }
      
      if (document.jurisdiction_id && document.jurisdiction_id.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "jurisdiction.jurisdiction_id"));
      }
      
   }

   
   async validateNoReferences(_id : string, skip_entities?: string[]) : Promise<void> {
      
      let hasReference = false;
      
      if (!skip_entities || skip_entities.length == 0 || !skip_entities.includes('GlobalAccount')){
         hasReference = await this.entities.globalAccountManager.anyWithJurisdiction(_id);
         if (hasReference) {
            throw new UIException(LocalizableString.General_ReferenceInUse('GlobalAccount'));
         }
      }
      if (!skip_entities || skip_entities.length == 0 || !skip_entities.includes('JurisdictionSetting')){
         hasReference = await this.entities.jurisdictionSettingManager.anyWithJurisdiction(_id);
         if (hasReference) {
            throw new UIException(LocalizableString.General_ReferenceInUse('JurisdictionSetting'));
         }
      }
      if (!skip_entities || skip_entities.length == 0 || !skip_entities.includes('JurisdictionAsset')){
         hasReference = await this.entities.jurisdictionAssetManager.anyWithJurisdiction(_id);
         if (hasReference) {
            throw new UIException(LocalizableString.General_ReferenceInUse('JurisdictionAsset'));
         }
      }
      if (!skip_entities || skip_entities.length == 0 || !skip_entities.includes('Account')){
         hasReference = await this.entities.accountManager.anyWithJurisdiction(_id);
         if (hasReference) {
            throw new UIException(LocalizableString.General_ReferenceInUse('Account'));
         }
      }
      if (!skip_entities || skip_entities.length == 0 || !skip_entities.includes('Widget')){
         hasReference = await this.entities.widgetManager.anyWithJurisdiction(_id);
         if (hasReference) {
            throw new UIException(LocalizableString.General_ReferenceInUse('Widget'));
         }
      }
   }
   
   protected async calculateSearchable(document: Jurisdiction) : Promise<void> {
      document.searchable = SEARCHABLE_DIVIDER;
      
      if (!isNullOrWhiteSpace(document.jurisdiction_id)) {
         document.searchable += document.jurisdiction_id!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
   }
   

   protected async postProcessFindAs<TProjection>(data: ListResult<TProjection>) : Promise<ListResult<TProjection>> {
      return data;
   }
   protected async preProcessMutationDocument(document: Jurisdiction, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationDocument(document: Jurisdiction, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
}