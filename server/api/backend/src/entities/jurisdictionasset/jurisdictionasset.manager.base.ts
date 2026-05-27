import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MongoManagerIsolated } from 'src/shared/managers/mongo-manager.isolated';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { JurisdictionAsset } from './jurisdictionasset.model';
import { QueryFilter, ProjectionFields, SortOrder, UpdateQuery } from 'mongoose';
import type { Document } from 'bson';
import { COLLECTION_NAME, PRIMARY_KEY } from './jurisdictionasset.schema';
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
export class JurisdictionAssetManagerBase extends MongoManagerIsolated<JurisdictionAsset> {
   protected readonly logger = new Logger(JurisdictionAssetManagerBase.name);

   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache: MemoryCache) {
      super(COLLECTION_NAME, PRIMARY_KEY, connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async validateExistence(jurisdiction_id:string, _id:string) {
      const found = await this._retrieveIsolated<JurisdictionAsset>(JurisdictionAsset, jurisdiction_id, _id, { _id: 1 });
      
      if (!found) {
         throw new UIException(LocalizableString.General_InvalidReference("JurisdictionAsset"));
      }
   }
   
   
   async anyWithJurisdiction(jurisdiction_id:string | undefined): Promise<boolean>{
      if (!jurisdiction_id){
         return false;
      }
      const filter: QueryFilter<JurisdictionAsset> = {
         jurisdiction_id: jurisdiction_id
      };

      const found = await this._findIsolated<JurisdictionAsset>(JurisdictionAsset, jurisdiction_id, filter, { _id: 1 }, 0, 1, undefined, false);
      return found.items.length > 0;
   }
   

   async getById(jurisdiction_id: string, _id: string): Promise<JurisdictionAsset | undefined> {
      const result = this._retrieveIsolated<JurisdictionAsset>(JurisdictionAsset, jurisdiction_id, _id, JurisdictionAsset.Projection);
      return result;
   }
   
   async getByIdInfo(jurisdiction_id: string, _id:string) : Promise<JurisdictionAsset.Info | undefined> {
      const result = await this._retrieveIsolated<JurisdictionAsset.Info>(JurisdictionAsset.Info, jurisdiction_id, _id, JurisdictionAsset.Info.Projection);
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
         const orFilter = BatchUtils.createOrFilter<JurisdictionAsset>(ids, '_id');
         const filter: QueryFilter<JurisdictionAsset> = {
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
      descending: boolean = false
   ): Promise<ListResult<JurisdictionAsset>> {
      return await this.findAs<JurisdictionAsset>(
         JurisdictionAsset,
         JurisdictionAsset.Projection,
         jurisdiction_id, 
         skip, 
         take,
         keyword,
         order_by, 
         descending
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
      descending: boolean = false
   ): Promise<ListResult<TProjection>> {
      const filter: QueryFilter<JurisdictionAsset> = {
         jurisdiction_id: jurisdiction_id,
      };
      
      if (!isNullOrWhiteSpace(keyword)) {
         // Escape special regex characters to treat them as literals
         const escapedKeyword = keyword!.toLowerCase().replace(/[+*?^${}()|[\]\\]/g, '\\$&');
         filter.searchable = { $regex: escapedKeyword, $options: 'i' };
      }
      
      const sorts = this.applySafeSort([{ field: order_by, descending}]);

      let result = await this._findIsolated<TProjection>(ctor, jurisdiction_id, filter, projection, skip, take, sorts);
      
      result = await this.postProcessFindAs(result);

      return result;
   }

   
   async insert(jurisdiction_id: string, document: JurisdictionAsset): Promise<JurisdictionAsset> {
      if (jurisdiction_id != document.jurisdiction_id) {
         throw new ConflictException("jurisdiction_id mismatch");
      }
      
      if (!document._id) {
         document._id = uuidv4();
      }
      
      document.created_utc = new Date();
      document.updated_utc = document.created_utc;

      await this.preProcessMutationDocument(document, DocumentOperation.insert);
      await this.preProcessMutationProcessPerspective(document.asProcessPerspective(), DocumentOperation.insert);
      
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      await this._insertIsolated(JurisdictionAsset, jurisdiction_id, document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.insert);
      await this.postProcessMutationProcessPerspective(document.asProcessPerspective(), DocumentOperation.insert);
      
      await this.dependencyCoordinator.markInvalidated("JurisdictionAsset", document);

      return document;
   }

   async replace(jurisdiction_id: string, _id: string, document: JurisdictionAsset): Promise<JurisdictionAsset> {
      if (jurisdiction_id != document.jurisdiction_id) {
         throw new ConflictException("jurisdiction_id mismatch");
      }
      
      document.updated_utc = new Date();

      await this.preProcessMutationDocument(document, DocumentOperation.replace);
      await this.preProcessMutationProcessPerspective(document.asProcessPerspective(), DocumentOperation.replace);
      
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      
      const unset: string[] | undefined = this.determineRemovableFieldsDocument(document);

      await this._upsertIsolated(JurisdictionAsset, jurisdiction_id, _id, document, unset);
      
      await this.postProcessMutationDocument(document, DocumentOperation.replace);
      await this.postProcessMutationProcessPerspective(document.asProcessPerspective(), DocumentOperation.replace);
      
      await this.dependencyCoordinator.markInvalidated("JurisdictionAsset", document);

      return document;

   }

   

   async delete(document: JurisdictionAsset, force: boolean = false): Promise<boolean> {
      await this.preProcessMutationDocument(document, DocumentOperation.delete);
      
      // Get Server version
      const actual = await this.getById(document.jurisdiction_id, document._id);
      if (actual == undefined) {
         return true;
      }
      
      if (!force){
         await this.validateNoReferences(actual.jurisdiction_id, actual._id);
      }
      
      const result = await this._deleteIsolated(actual.jurisdiction_id, actual._id);
      if (result) {
         await this.postProcessMutationDocument(actual, DocumentOperation.delete);
      }
      
      return result;
   }
   
   async updateProcessPerspective(perspective: JurisdictionAsset.ProcessPerspective){
      const actual = perspective.getActual();

      await this.preProcessMutationProcessPerspective(perspective, DocumentOperation.updatePerspective);
      
      await this.sanitizeProcessPerspective(perspective);
      
      await this.validateProcessPerspective(perspective);
      const filter = { _id: perspective._id };
      const update: UpdateQuery<JurisdictionAsset>  = {
         $set: {
            updated_utc: new Date(),
            size_kb: perspective.size_kb,
            duration_secs: perspective.duration_secs,
            dependency: perspective.dependency,
            capsule_id: perspective.capsule_id,
            dependency_id: perspective.dependency_id,
            available: perspective.available,
            resize_required: perspective.resize_required,
            resize_status: perspective.resize_status,
            resize_attempts: perspective.resize_attempts,
            resize_attempt_utc: perspective.resize_attempt_utc,
            resize_log: perspective.resize_log,
            thumb_dimensions: perspective.thumb_dimensions,
            large_dimensions: perspective.large_dimensions,
            thumb_small_key: perspective.thumb_small_key,
            thumb_large_key: perspective.thumb_large_key
         }
      };
      const removableFields = this.determineRemovableFieldsProcessPerspective(perspective);
      if (removableFields) {
         update.$unset = removableFields;
      }

      const result = await this._updatePartialIsolated(perspective.jurisdiction_id, filter, update);
      
      if (result.matchedCount > 0) {
         await this.postProcessMutationProcessPerspective(perspective, DocumentOperation.updatePerspective);
      }
      
      return result.matchedCount > 0;
   }

   protected determineRemovableFieldsProcessPerspective(perspective: JurisdictionAsset.ProcessPerspective): Record<string, 1> | undefined {
      if (!perspective){
         return; // sanity
      }

      // Check all nullable perspective fields for unset (handles both primitives and classes)
      const fieldsToRemove:string[] = [];
      
      if (perspective.size_kb === undefined) {
         fieldsToRemove.push("size_kb");
      }
      if (perspective.duration_secs === undefined) {
         fieldsToRemove.push("duration_secs");
      }
      if (perspective.dependency === undefined) {
         fieldsToRemove.push("dependency");
      }
      if (perspective.capsule_id === undefined) {
         fieldsToRemove.push("capsule_id");
      }
      if (perspective.dependency_id === undefined) {
         fieldsToRemove.push("dependency_id");
      }
      if (perspective.resize_status === undefined) {
         fieldsToRemove.push("resize_status");
      }
      if (perspective.resize_attempts === undefined) {
         fieldsToRemove.push("resize_attempts");
      }
      if (perspective.resize_attempt_utc === undefined) {
         fieldsToRemove.push("resize_attempt_utc");
      }
      if (perspective.resize_log === undefined) {
         fieldsToRemove.push("resize_log");
      }
      if (perspective.thumb_dimensions === undefined) {
         fieldsToRemove.push("thumb_dimensions");
      }
      if (perspective.large_dimensions === undefined) {
         fieldsToRemove.push("large_dimensions");
      }
      if (perspective.thumb_small_key === undefined) {
         fieldsToRemove.push("thumb_small_key");
      }
      if (perspective.thumb_large_key === undefined) {
         fieldsToRemove.push("thumb_large_key");
      }
      
      if (fieldsToRemove.length > 0) {
         const unset = {} as Record<string, 1>;
         fieldsToRemove.forEach(field => {
            unset[field] = 1;
         });
         return unset;
      }

      return undefined;
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
      
      // dependencies
      match = indexes.find(x => x.name == 'dependencies');
      if (!match)
      {
         const options = {
            unique: false,
            name: 'dependencies'
         };
         const fields = {
            dependency: 1,
            dependency_id: 1,
         };
         await collection.createIndex(fields, options);
      }
      
      // resize
      match = indexes.find(x => x.name == 'resize');
      if (!match)
      {
         const options = {
            unique: false,
            name: 'resize'
         };
         const fields = {
            resize_required: 1,
            resize_attempts: 1,
            resize_status: 1,
         };
         await collection.createIndex(fields, options);
      }
      
      // shard_key_hashed (pre-created for future sharding)
      match = indexes.find(x => x.name == 'shard_key_hashed');
      if (!match)
      {
         const options = {
            unique: false,
            name: 'shard_key_hashed'
         };
         const fields = {
            _id: 'hashed' as const,
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

   protected determineRemovableFieldsDocument(document: JurisdictionAsset): string[] | undefined {
      if (!document){
         return; // sanity
      }
      const fieldsToRemove:string[] = [];
      
      // Check all nullable fields for unset (handles both primitives and classes)
      if (document.size_kb === undefined) {
         fieldsToRemove.push('size_kb');
      }
      if (document.duration_secs === undefined) {
         fieldsToRemove.push('duration_secs');
      }
      if (document.dependency === undefined) {
         fieldsToRemove.push('dependency');
      }
      if (document.account_id_creator === undefined) {
         fieldsToRemove.push('account_id_creator');
      }
      if (document.capsule_id === undefined) {
         fieldsToRemove.push('capsule_id');
      }
      if (document.dependency_id === undefined) {
         fieldsToRemove.push('dependency_id');
      }
      if (document.resize_status === undefined) {
         fieldsToRemove.push('resize_status');
      }
      if (document.resize_attempts === undefined) {
         fieldsToRemove.push('resize_attempts');
      }
      if (document.resize_attempt_utc === undefined) {
         fieldsToRemove.push('resize_attempt_utc');
      }
      if (document.resize_log === undefined) {
         fieldsToRemove.push('resize_log');
      }
      if (document.thumb_dimensions === undefined) {
         fieldsToRemove.push('thumb_dimensions');
      }
      if (document.large_dimensions === undefined) {
         fieldsToRemove.push('large_dimensions');
      }
      if (document.thumb_small_key === undefined) {
         fieldsToRemove.push('thumb_small_key');
      }
      if (document.thumb_large_key === undefined) {
         fieldsToRemove.push('thumb_large_key');
      }
      
      // Empty Guids
      if (document.account_id_creator === undefined || document.account_id_creator === '') {
         fieldsToRemove.push('account_id_creator');
      }
      if (document.capsule_id === undefined || document.capsule_id === '') {
         fieldsToRemove.push('capsule_id');
      }
      if (document.dependency_id === undefined || document.dependency_id === '') {
         fieldsToRemove.push('dependency_id');
      }
      
      return fieldsToRemove;
   }

   /**
    * Only allow sorting by known indexed fields
    */
   protected applySafeSort(sorts:SortInfo[]) : [string, SortOrder][] {
      const result: [string, SortOrder][] = [];

      const allowedFields = ['_id', 'asset_kind', 'file_name', 'size_kb', 'duration_secs', 'dependency', 'resize_attempts', 'resize_attempt_utc'];
      
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

   protected async sanitize(document: JurisdictionAsset) : Promise<void> {
      JurisdictionAsset.sanitize(document);
   }
   
   protected async sanitizeProcessPerspective(perspective:JurisdictionAsset.ProcessPerspective) {
      
      if (perspective.resize_log && perspective.resize_log.length > 512) {
         perspective.resize_log = truncateStart(perspective.resize_log, 512);
      }
      
      perspective.resize_status = sanitizeHtml(perspective.resize_status, false);
      perspective.resize_log = sanitizeHtml(perspective.resize_log, false);
   }
   

   protected async validate(document: JurisdictionAsset): Promise<void> {
      // Fields
      
      if (!document._id || !uuidValidate(document._id)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdictionasset._id"));
      }
      
      if (isNullOrWhiteSpace(document.jurisdiction_id)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdictionasset.jurisdiction_id"));
      }
      
      if (isNullOrWhiteSpace(document.file_name)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdictionasset.file_name"));
      }
      
      if (isNullOrWhiteSpace(document.storage_key)) {
         throw new UIException(LocalizableString.General_FieldRequired("jurisdictionasset.storage_key"));
      }
      
      if (document.jurisdiction_id && document.jurisdiction_id.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "jurisdictionasset.jurisdiction_id"));
      }
      
      if (document.file_name && document.file_name.length > 120) {
         throw new UIException(LocalizableString.General_FieldMaxLength(120, "jurisdictionasset.file_name"));
      }
      
      if (document.storage_key && document.storage_key.length > 512) {
         throw new UIException(LocalizableString.General_FieldMaxLength(512, "jurisdictionasset.storage_key"));
      }
      
      if (document.resize_status && document.resize_status.length > 20) {
         throw new UIException(LocalizableString.General_FieldMaxLength(20, "jurisdictionasset.resize_status"));
      }
      
      if (document.resize_log && document.resize_log.length > 512) {
         throw new UIException(LocalizableString.General_FieldMaxLength(512, "jurisdictionasset.resize_log"));
      }
      
      if (document.thumb_small_key && document.thumb_small_key.length > 512) {
         throw new UIException(LocalizableString.General_FieldMaxLength(512, "jurisdictionasset.thumb_small_key"));
      }
      
      if (document.thumb_large_key && document.thumb_large_key.length > 512) {
         throw new UIException(LocalizableString.General_FieldMaxLength(512, "jurisdictionasset.thumb_large_key"));
      }
      
   }

   
   protected async validateProcessPerspective(document: JurisdictionAsset.ProcessPerspective): Promise<void> {
      
      if (document.resize_status && document.resize_status.length > 20) {
         throw new UIException(LocalizableString.General_FieldMaxLength(20, "jurisdictionasset.resize_status"));
      }
      
      if (document.resize_log && document.resize_log.length > 512) {
         throw new UIException(LocalizableString.General_FieldMaxLength(512, "jurisdictionasset.resize_log"));
      }
      
      if (document.thumb_small_key && document.thumb_small_key.length > 512) {
         throw new UIException(LocalizableString.General_FieldMaxLength(512, "jurisdictionasset.thumb_small_key"));
      }
      
      if (document.thumb_large_key && document.thumb_large_key.length > 512) {
         throw new UIException(LocalizableString.General_FieldMaxLength(512, "jurisdictionasset.thumb_large_key"));
      }
      
   }
   
   async validateNoReferences(jurisdiction_id: string, _id : string, skip_entities?: string[]) : Promise<void> {
      
      let hasReference = false;
      
      if (!skip_entities || skip_entities.length == 0 || !skip_entities.includes('Account')){
         hasReference = await this.entities.accountManager.anyWithAvatar(jurisdiction_id, _id);
         if (hasReference) {
            throw new UIException(LocalizableString.General_ReferenceInUse('Account'));
         }
      }
      if (!skip_entities || skip_entities.length == 0 || !skip_entities.includes('Widget')){
         hasReference = await this.entities.widgetManager.anyWithMediaAsset(jurisdiction_id, _id);
         if (hasReference) {
            throw new UIException(LocalizableString.General_ReferenceInUse('Widget'));
         }
      }
   }
   
   protected async calculateSearchable(document: JurisdictionAsset) : Promise<void> {
      document.searchable = SEARCHABLE_DIVIDER;
      
      if (!isNullOrWhiteSpace(document._id)) {
         document.searchable += document._id!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
      if (!isNullOrWhiteSpace(document.file_name)) {
         document.searchable += document.file_name!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
   }
   

   protected async postProcessFindAs<TProjection>(data: ListResult<TProjection>) : Promise<ListResult<TProjection>> {
      return data;
   }
   protected async preProcessMutationDocument(document: JurisdictionAsset, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationDocument(document: JurisdictionAsset, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
   protected async preProcessMutationProcessPerspective(perspective: JurisdictionAsset.ProcessPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationProcessPerspective(perspective: JurisdictionAsset.ProcessPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
}