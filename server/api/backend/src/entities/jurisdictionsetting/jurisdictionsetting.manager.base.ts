import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MongoManagerIsolated } from 'src/shared/managers/mongo-manager.isolated';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { JurisdictionSetting } from './jurisdictionsetting.model';
import { QueryFilter, ProjectionFields, SortOrder, UpdateQuery } from 'mongoose';
import type { Document } from 'bson';
import { COLLECTION_NAME, PRIMARY_KEY } from './jurisdictionsetting.schema';
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
export class JurisdictionSettingManagerBase extends MongoManagerIsolated<JurisdictionSetting> {
   protected readonly logger = new Logger(JurisdictionSettingManagerBase.name);

   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache: MemoryCache) {
      super(COLLECTION_NAME, PRIMARY_KEY, connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async validateExistence(jurisdiction_id:string, _id:string) {
      const found = await this._retrieveIsolated<JurisdictionSetting>(JurisdictionSetting, jurisdiction_id, _id, { _id: 1 });
      
      if (!found) {
         throw new UIException(LocalizableString.General_InvalidReference("JurisdictionSetting"));
      }
   }
   
   
   async anyWithJurisdiction(jurisdiction_id:string | undefined): Promise<boolean>{
      if (!jurisdiction_id){
         return false;
      }
      const filter: QueryFilter<JurisdictionSetting> = {
         jurisdiction_id: jurisdiction_id
      };

      const found = await this._findIsolated<JurisdictionSetting>(JurisdictionSetting, jurisdiction_id, filter, { _id: 1 }, 0, 1, undefined, false);
      return found.items.length > 0;
   }
   

   async getById(jurisdiction_id: string, _id: string): Promise<JurisdictionSetting | undefined> {
      const result = this._retrieveIsolated<JurisdictionSetting>(JurisdictionSetting, jurisdiction_id, _id, JurisdictionSetting.Projection);
      return result;
   }
   

   async getWithin<TProjection>(
      ctor: new (...args: any[]) => TProjection, 
      projection: ProjectionFields<TProjection>,
      jurisdiction_id: string,
      ids: string[]
   ): Promise<TProjection[]> {
      if (!ids || ids.length === 0) {
         return [];
      }

      const result = BatchUtils.getWithinBuffered(ids, async (ids: string[]): Promise<TProjection[]> => {
         const orFilter = BatchUtils.createOrFilter<JurisdictionSetting>(ids, '_id');
         const filter: QueryFilter<JurisdictionSetting> = {
            jurisdiction_id: jurisdiction_id,
            ...orFilter,
         };

         const result = await this._findIsolated<TProjection>(ctor, jurisdiction_id, filter, projection, 0, MAX_INT_32);
         
         return result.items;
      });
      return result;
      
   }

   

   async find(
      jurisdiction_id: string, 
      skip: number, 
      take: number,
      keyword?: string,
      order_by?: string, 
      descending: boolean = false,
      name?: string
   ): Promise<ListResult<JurisdictionSetting>> {
      return await this.findAs<JurisdictionSetting>(
         JurisdictionSetting,
         JurisdictionSetting.Projection,
         jurisdiction_id, 
         skip, 
         take,
         keyword,
         order_by, 
         descending,
         name
      );
   }
   

   protected async findAs<TProjection>(
      ctor: new (...args: any[]) => TProjection, 
      projection: ProjectionFields<TProjection>,
      jurisdiction_id: string, 
      skip: number, 
      take: number,
      keyword?: string,
      order_by?: string, 
      descending: boolean = false,
      name?: string
   ): Promise<ListResult<TProjection>> {
      const filter: QueryFilter<JurisdictionSetting> = {
         jurisdiction_id: jurisdiction_id,
      };
      
      if (!isNullOrWhiteSpace(keyword)) {
         // Escape special regex characters to treat them as literals
         const escapedKeyword = keyword!.toLowerCase().replace(/[+*?^${}()|[\]\\]/g, '\\$&');
         filter.searchable = { $regex: escapedKeyword, $options: 'i' };
      }
      
      if(!isNullOrWhiteSpace(name)) {
         filter.name = name;
      }
      
      const sorts = this.applySafeSort([{ field: order_by, descending}]);

      let result = await this._findIsolated<TProjection>(ctor, jurisdiction_id, filter, projection, skip, take, sorts);
      
      result = await this.postProcessFindAs(result);

      return result;
   }

   
   async insert(jurisdiction_id: string, document: JurisdictionSetting): Promise<JurisdictionSetting> {
      if (jurisdiction_id != document.jurisdiction_id) {
         throw new ConflictException("jurisdiction_id mismatch");
      }
      
      if (!document._id) {
         document._id = uuidv4();
      }
      
      // ID Alias
      document.name = document._id;
      
      document.created_utc = new Date();
      document.updated_utc = document.created_utc;

      await this.preProcessMutationDocument(document, DocumentOperation.insert);
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      await this._insertIsolated(JurisdictionSetting, jurisdiction_id, document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.insert);
      await this.dependencyCoordinator.markInvalidated("JurisdictionSetting", document);

      return document;
   }

   async replace(jurisdiction_id: string, _id: string, document: JurisdictionSetting): Promise<JurisdictionSetting> {
      if (jurisdiction_id != document.jurisdiction_id) {
         throw new ConflictException("jurisdiction_id mismatch");
      }
      
      // ID Alias
      document.name = document._id;
      
      document.updated_utc = new Date();

      await this.preProcessMutationDocument(document, DocumentOperation.replace);
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      
      const unset: string[] | undefined = undefined; // No nullable nested objects to remove

      await this._upsertIsolated(JurisdictionSetting, jurisdiction_id, _id, document, unset);
      
      await this.postProcessMutationDocument(document, DocumentOperation.replace);
      await this.dependencyCoordinator.markInvalidated("JurisdictionSetting", document);

      return document;

   }

   

   async delete(document: JurisdictionSetting): Promise<boolean> {
      await this.preProcessMutationDocument(document, DocumentOperation.delete);
      
      // Get Server version
      const actual = await this.getById(document.jurisdiction_id, document._id);
      if (actual == undefined) {
         return true;
      }
      
      const result = await this._deleteIsolated(actual.jurisdiction_id, actual._id);
      if (result) {
         await this.postProcessMutationDocument(actual, DocumentOperation.delete);
      }
      
      return result;
   }
   

   async ensureIndexes(jurisdiction_id: string): Promise<void> {
      const connection = await this.getIsolatedConnection(jurisdiction_id);
      const existing = await connection.db!.listCollections({ name: this.collectionName }).toArray();
      if (existing.length == 0){
         return; // doesn't exist yet
      }
      
      const model = await this.getIsolatedModel(jurisdiction_id);
      const collection = model.db.collection(this.collectionName);
      const indexes = await collection.indexes();

      let match:Document | undefined = undefined;
      
      // default_pkey_routed_v1
      match = indexes.find(x => x.name == 'default_pkey_routed_v1');
      if (!match)
      {
         const options = {
            unique: false,
            name: 'default_pkey_routed_v1'
         };
         const fields = {
            jurisdiction_id: 1,
            _id: 1
         };

         await collection.createIndex(fields, options);
      }
      
      // unique_setting
      match = indexes.find(x => x.name == "unique_setting");
      if (!match)
      {
         const options = {
            unique: true,
            name: 'unique_setting'
         };
         const fields = {
            name: 1,
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
            jurisdiction_id: 1,
            searchable: 1,
         };
         await collection.createIndex(fields, options);
      }
      
   }

   protected determineRemovableFieldsDocument(document: JurisdictionSetting): string[] | undefined {
      if (!document){
         return; // sanity
      }
      const fieldsToRemove:string[] = [];
      
      // Check all nullable fields for unset (handles both primitives and classes)
      if (document.value === undefined) {
         fieldsToRemove.push('value');
      }
      
      return fieldsToRemove;
   }

   /**
    * Only allow sorting by known indexed fields
    */
   protected applySafeSort(sorts:SortInfo[]) : [string, SortOrder][] {
      const result: [string, SortOrder][] = [];

      const allowedFields = ['name', 'value'];
      
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

   protected async sanitize(document: JurisdictionSetting) : Promise<void> {
      JurisdictionSetting.sanitize(document);
   }
   

   protected async validate(document: JurisdictionSetting): Promise<void> {
      // Fields
      
      if (isNullOrWhiteSpace(document._id)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdictionsetting._id"));
      }
      
      if (isNullOrWhiteSpace(document.name)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdictionsetting.name"));
      }
      
      if (isNullOrWhiteSpace(document.jurisdiction_id)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdictionsetting.jurisdiction_id"));
      }
      
      if (document._id && document._id.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "jurisdictionsetting._id"));
      }
      
      if (document.name && document.name.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "jurisdictionsetting.name"));
      }
      
      if (document.jurisdiction_id && document.jurisdiction_id.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "jurisdictionsetting.jurisdiction_id"));
      }
      
   }

   
   protected async calculateSearchable(document: JurisdictionSetting) : Promise<void> {
      document.searchable = SEARCHABLE_DIVIDER;
      
      if (!isNullOrWhiteSpace(document.name)) {
         document.searchable += document.name!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
      if (!isNullOrWhiteSpace(document.value)) {
         document.searchable += document.value!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
   }
   

   protected async postProcessFindAs<TProjection>(data: ListResult<TProjection>) : Promise<ListResult<TProjection>> {
      return data;
   }
   protected async preProcessMutationDocument(document: JurisdictionSetting, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationDocument(document: JurisdictionSetting, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
}