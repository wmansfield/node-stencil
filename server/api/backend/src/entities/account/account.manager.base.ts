import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MongoManagerIsolated } from 'src/shared/managers/mongo-manager.isolated';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { Account } from './account.model';
import { QueryFilter, ProjectionFields, SortOrder, UpdateQuery } from 'mongoose';
import type { Document } from 'bson';
import { COLLECTION_NAME, PRIMARY_KEY } from './account.schema';
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
import { SynchronizableEntityIsolated } from 'src/shared/managers/synchronized-entity';

@Injectable()
export class AccountManagerBase extends MongoManagerIsolated<Account> implements SynchronizableEntityIsolated {
   protected readonly logger = new Logger(AccountManagerBase.name);

   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache: MemoryCache) {
      super(COLLECTION_NAME, PRIMARY_KEY, connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async validateExistence(jurisdiction_id:string, _id:string) {
      const found = await this._retrieveIsolated<Account>(Account, jurisdiction_id, _id, { _id: 1 });
      
      if (!found) {
         throw new UIException(LocalizableString.General_InvalidReference("Account"));
      }
   }
   
   
   async anyWithJurisdiction(jurisdiction_id:string | undefined): Promise<boolean>{
      if (!jurisdiction_id){
         return false;
      }
      const filter: QueryFilter<Account> = {
         jurisdiction_id: jurisdiction_id
      };

      const found = await this._findIsolated<Account>(Account, jurisdiction_id, filter, { _id: 1 }, 0, 1, undefined, false);
      return found.items.length > 0;
   }
   
   async anyWithAvatar(jurisdiction_id:string, asset_id_avatar:string | undefined): Promise<boolean>{
      if (!asset_id_avatar){
         return false;
      }
      const filter: QueryFilter<Account> = {
         jurisdiction_id: jurisdiction_id,
         asset_id_avatar: asset_id_avatar
      };

      const found = await this._findIsolated<Account>(Account, jurisdiction_id, filter, { _id: 1 }, 0, 1, undefined, false);
      return found.items.length > 0;
   }
   

   async getById(jurisdiction_id: string, _id: string): Promise<Account | undefined> {
      const result = this._retrieveIsolated<Account>(Account, jurisdiction_id, _id, Account.Projection);
      return result;
   }
   
   async getByIdInternal(jurisdiction_id: string, _id:string) : Promise<Account.Internal | undefined> {
      const result = await this._retrieveIsolated<Account.Internal>(Account.Internal, jurisdiction_id, _id, Account.Internal.Projection);
      return result;
   }
   
   async getByIdPublic(jurisdiction_id: string, _id:string) : Promise<Account.Public | undefined> {
      const result = await this._retrieveIsolated<Account.Public>(Account.Public, jurisdiction_id, _id, Account.Public.Projection);
      return result;
   }
   
   async getByIdConnection(jurisdiction_id: string, _id:string) : Promise<Account.Connection | undefined> {
      const result = await this._retrieveIsolated<Account.Connection>(Account.Connection, jurisdiction_id, _id, Account.Connection.Projection);
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
         const orFilter = BatchUtils.createOrFilter<Account>(ids, '_id');
         const filter: QueryFilter<Account> = {
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
      asset_id_avatar?: string
   ): Promise<ListResult<Account>> {
      return await this.findAs<Account>(
         Account,
         Account.Projection,
         jurisdiction_id, 
         skip, 
         take,
         keyword,
         order_by, 
         descending,
         asset_id_avatar
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
      asset_id_avatar?: string
   ): Promise<ListResult<TProjection>> {
      const filter: QueryFilter<Account> = {
         jurisdiction_id: jurisdiction_id,
      };
      
      if(asset_id_avatar !== undefined && asset_id_avatar !== null) {
         filter.asset_id_avatar = asset_id_avatar;
      }
      
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

   
   async insert(jurisdiction_id: string, document: Account): Promise<Account> {
      if (jurisdiction_id != document.jurisdiction_id) {
         throw new ConflictException("jurisdiction_id mismatch");
      }
      
      if (!document._id) {
         document._id = uuidv4();
      }
      
      document.created_utc = new Date();
      document.updated_utc = document.created_utc;

      await this.preProcessMutationDocument(document, DocumentOperation.insert);
      await this.preProcessMutationInfoPerspective(document.asInfoPerspective(), DocumentOperation.insert);
      
      await this.preProcessMutationStatusPerspective(document.asStatusPerspective(), DocumentOperation.insert);
      
      await this.preProcessMutationPermissionsPerspective(document.asPermissionsPerspective(), DocumentOperation.insert);
      
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      document.calculationMarkDirty(this.defaultAgent, "replace");
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      if (!!document.asset_id_avatar) {
         await this.entities.jurisdictionAssetManager.validateExistence(document.jurisdiction_id, document.asset_id_avatar);
      }
      
      await this._insertIsolated(Account, jurisdiction_id, document);
      
      await this.calculateAndPersist(document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.insert);
      await this.postProcessMutationInfoPerspective(document.asInfoPerspective(), DocumentOperation.insert);
      
      await this.postProcessMutationStatusPerspective(document.asStatusPerspective(), DocumentOperation.insert);
      
      await this.postProcessMutationPermissionsPerspective(document.asPermissionsPerspective(), DocumentOperation.insert);
      
      await this.dependencyCoordinator.markInvalidated("Account", document);

      return document;
   }

   async replace(jurisdiction_id: string, _id: string, document: Account): Promise<Account> {
      if (jurisdiction_id != document.jurisdiction_id) {
         throw new ConflictException("jurisdiction_id mismatch");
      }
      
      document.updated_utc = new Date();

      await this.preProcessMutationDocument(document, DocumentOperation.replace);
      await this.preProcessMutationInfoPerspective(document.asInfoPerspective(), DocumentOperation.replace);
      
      await this.preProcessMutationStatusPerspective(document.asStatusPerspective(), DocumentOperation.replace);
      
      await this.preProcessMutationPermissionsPerspective(document.asPermissionsPerspective(), DocumentOperation.replace);
      
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      document.calculationMarkDirty(this.defaultAgent, "replace");
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      if (!!document.asset_id_avatar) {
         await this.entities.jurisdictionAssetManager.validateExistence(document.jurisdiction_id, document.asset_id_avatar);
      }
      
      
      const unset: string[] | undefined = this.determineRemovableFieldsDocument(document);

      await this._upsertIsolated(Account, jurisdiction_id, _id, document, unset);
      
      await this.calculateAndPersist(document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.replace);
      await this.postProcessMutationInfoPerspective(document.asInfoPerspective(), DocumentOperation.replace);
      
      await this.postProcessMutationStatusPerspective(document.asStatusPerspective(), DocumentOperation.replace);
      
      await this.postProcessMutationPermissionsPerspective(document.asPermissionsPerspective(), DocumentOperation.replace);
      
      await this.dependencyCoordinator.markInvalidated("Account", document);

      return document;

   }

   

   async delete(document: Account): Promise<boolean> {
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
   
   async updateInfoPerspective(perspective: Account.InfoPerspective){
      const actual = perspective.getActual();

      await this.preProcessMutationInfoPerspective(perspective, DocumentOperation.updatePerspective);
      
      await this.sanitizeInfoPerspective(perspective);
      
      await this.validateInfoPerspective(perspective);
      
      await this.calculateSearchable(actual);
      
      actual.calculationMarkDirty(this.defaultAgent, "update_InfoPerspective");
      
      if (perspective.asset_id_avatar !== undefined) {
         await this.entities.jurisdictionAssetManager.validateExistence(perspective.jurisdiction_id, perspective.asset_id_avatar);
      }
      const filter = { _id: perspective._id };
      const update: UpdateQuery<Account>  = {
         $set: {
            updated_utc: new Date(),
            searchable: actual.searchable,
            asset_id_avatar: perspective.asset_id_avatar,
            display_name: perspective.display_name
         }
      };
      const removableFields = this.determineRemovableFieldsInfoPerspective(perspective);
      if (removableFields) {
         update.$unset = removableFields;
      }

      const result = await this._updatePartialIsolated(perspective.jurisdiction_id, filter, update);
      
      await this.calculateAndPersist(perspective.getActual());
      
      if (result.matchedCount > 0) {
         await this.postProcessMutationInfoPerspective(perspective, DocumentOperation.updatePerspective);
      }
      
      return result.matchedCount > 0;
   }

   protected determineRemovableFieldsInfoPerspective(perspective: Account.InfoPerspective): Record<string, 1> | undefined {
      if (!perspective){
         return; // sanity
      }

      // Check all nullable perspective fields for unset (handles both primitives and classes)
      const fieldsToRemove:string[] = [];
      
      if (perspective.asset_id_avatar === undefined) {
         fieldsToRemove.push("asset_id_avatar");
      }
      if (perspective.display_name === undefined) {
         fieldsToRemove.push("display_name");
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
   
   async updateStatusPerspective(perspective: Account.StatusPerspective){
      const actual = perspective.getActual();

      await this.preProcessMutationStatusPerspective(perspective, DocumentOperation.updatePerspective);
      
      await this.sanitizeStatusPerspective(perspective);
      
      await this.validateStatusPerspective(perspective);
      
      await this.calculateSearchable(actual);
      
      actual.calculationMarkDirty(this.defaultAgent, "update_StatusPerspective");
      const filter = { _id: perspective._id };
      const update: UpdateQuery<Account>  = {
         $set: {
            updated_utc: new Date(),
            searchable: actual.searchable,
            email: perspective.email,
            account_status: perspective.account_status
         }
      };
      const removableFields = this.determineRemovableFieldsStatusPerspective(perspective);
      if (removableFields) {
         update.$unset = removableFields;
      }

      const result = await this._updatePartialIsolated(perspective.jurisdiction_id, filter, update);
      
      await this.calculateAndPersist(perspective.getActual());
      
      if (result.matchedCount > 0) {
         await this.postProcessMutationStatusPerspective(perspective, DocumentOperation.updatePerspective);
      }
      
      return result.matchedCount > 0;
   }

   protected determineRemovableFieldsStatusPerspective(perspective: Account.StatusPerspective): Record<string, 1> | undefined {
      if (!perspective){
         return; // sanity
      }

      // Check all nullable perspective fields for unset (handles both primitives and classes)
      const fieldsToRemove:string[] = [];
      
      
      if (fieldsToRemove.length > 0) {
         const unset = {} as Record<string, 1>;
         fieldsToRemove.forEach(field => {
            unset[field] = 1;
         });
         return unset;
      }

      return undefined;
   }
   
   async updatePermissionsPerspective(perspective: Account.PermissionsPerspective){
      const actual = perspective.getActual();

      await this.preProcessMutationPermissionsPerspective(perspective, DocumentOperation.updatePerspective);
      
      await this.sanitizePermissionsPerspective(perspective);
      
      await this.validatePermissionsPerspective(perspective);
      const filter = { _id: perspective._id };
      const update: UpdateQuery<Account>  = {
         $set: {
            updated_utc: new Date(),
            roles: perspective.roles
         }
      };
      const removableFields = this.determineRemovableFieldsPermissionsPerspective(perspective);
      if (removableFields) {
         update.$unset = removableFields;
      }

      const result = await this._updatePartialIsolated(perspective.jurisdiction_id, filter, update);
      
      // Bypassing calculateAndPersist, no extral fields flagged for recalculate
      
      if (result.matchedCount > 0) {
         await this.postProcessMutationPermissionsPerspective(perspective, DocumentOperation.updatePerspective);
      }
      
      return result.matchedCount > 0;
   }

   protected determineRemovableFieldsPermissionsPerspective(perspective: Account.PermissionsPerspective): Record<string, 1> | undefined {
      if (!perspective){
         return; // sanity
      }

      // Check all nullable perspective fields for unset (handles both primitives and classes)
      const fieldsToRemove:string[] = [];
      
      if (perspective.roles === undefined) {
         fieldsToRemove.push("roles");
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
      
      // default_sync_v1
      match = indexes.find(x => x.name == 'default_sync_v1');
      if (!match) {
         const options = {
            unique: false, 
            name: 'default_sync_v1'
         };
          const fields = {
            calculation_utc: 1,
            calculation_agent: 1
         };
         await collection.createIndex(fields, options);
      }
      
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

   protected determineRemovableFieldsDocument(document: Account): string[] | undefined {
      if (!document){
         return; // sanity
      }
      const fieldsToRemove:string[] = [];
      
      // Check all nullable fields for unset (handles both primitives and classes)
      if (document.asset_id_avatar === undefined) {
         fieldsToRemove.push('asset_id_avatar');
      }
      if (document.display_name === undefined) {
         fieldsToRemove.push('display_name');
      }
      if (document.roles === undefined) {
         fieldsToRemove.push('roles');
      }
      
      // Empty Guids
      if (document.asset_id_avatar === undefined || document.asset_id_avatar === '') {
         fieldsToRemove.push('asset_id_avatar');
      }
      
      return fieldsToRemove;
   }

   /**
    * Only allow sorting by known indexed fields
    */
   protected applySafeSort(sorts:SortInfo[]) : [string, SortOrder][] {
      const result: [string, SortOrder][] = [];

      const allowedFields = ['email', 'display_name', 'auth_identifier', 'auth_provider', 'joined_utc', 'account_status'];
      
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

   protected async sanitize(document: Account) : Promise<void> {
      Account.sanitize(document);
   }
   
   protected async sanitizeInfoPerspective(perspective:Account.InfoPerspective) {
      
      perspective.display_name = sanitizeHtml(perspective.display_name, false);
   }
   
   protected async sanitizeStatusPerspective(perspective:Account.StatusPerspective) {
      
      perspective.email = sanitizeHtml(perspective.email, false);
   }
   
   protected async sanitizePermissionsPerspective(perspective:Account.PermissionsPerspective) {
      
   }
   

   protected async validate(document: Account): Promise<void> {
      // Fields
      
      if (!document._id || !uuidValidate(document._id)) {
         throw new UIException(LocalizableString.General_FieldRequired("account._id"));
      }
      
      if (isNullOrWhiteSpace(document.jurisdiction_id)) {
         throw new UIException(LocalizableString.General_FieldRequired("account.jurisdiction_id"));
      }
      
      if (isNullOrWhiteSpace(document.email)) {
         throw new UIException(LocalizableString.General_FieldRequired("account.email"));
      }
      
      if (isNullOrWhiteSpace(document.auth_identifier)) {
         throw new UIException(LocalizableString.General_FieldRequired("account.auth_identifier"));
      }
      
      if (isNullOrWhiteSpace(document.auth_provider)) {
         throw new UIException(LocalizableString.General_FieldRequired("account.auth_provider"));
      }
      
      if (!document.joined_utc || document.joined_utc.getTime() == new Date(0).getTime()){
         throw new UIException(LocalizableString.General_FieldRequired("account.joined_utc"));
      }
      
      if (document.jurisdiction_id && document.jurisdiction_id.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "account.jurisdiction_id"));
      }
      
      if (document.email && document.email.length > 128) {
         throw new UIException(LocalizableString.General_FieldMaxLength(128, "account.email"));
      }
      
      if (document.display_name && document.display_name.length > 150) {
         throw new UIException(LocalizableString.General_FieldMaxLength(150, "account.display_name"));
      }
      
      if (document.auth_identifier && document.auth_identifier.length > 150) {
         throw new UIException(LocalizableString.General_FieldMaxLength(150, "account.auth_identifier"));
      }
      
      if (document.auth_provider && document.auth_provider.length > 150) {
         throw new UIException(LocalizableString.General_FieldMaxLength(150, "account.auth_provider"));
      }
      
   }

   
   protected async validateInfoPerspective(document: Account.InfoPerspective): Promise<void> {
      
      if (document.display_name && document.display_name.length > 150) {
         throw new UIException(LocalizableString.General_FieldMaxLength(150, "account.display_name"));
      }
      
   }
   
   protected async validateStatusPerspective(document: Account.StatusPerspective): Promise<void> {
      
      if (isNullOrWhiteSpace(document.email)) {
         throw new UIException(LocalizableString.General_FieldRequired("account.email"));
      }
      
      if (document.email && document.email.length > 128) {
         throw new UIException(LocalizableString.General_FieldMaxLength(128, "account.email"));
      }
      
   }
   
   protected async validatePermissionsPerspective(document: Account.PermissionsPerspective): Promise<void> {
      
   }
   
   protected async calculateSearchable(document: Account) : Promise<void> {
      document.searchable = SEARCHABLE_DIVIDER;
      
      if (!isNullOrWhiteSpace(document.email)) {
         document.searchable += document.email!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
      if (!isNullOrWhiteSpace(document.display_name)) {
         document.searchable += document.display_name!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
      if (!isNullOrWhiteSpace(document.auth_identifier)) {
         document.searchable += document.auth_identifier!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
      if (!isNullOrWhiteSpace(document.auth_provider)) {
         document.searchable += document.auth_provider!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
   }
   
   async synchronizeDirtyItems(tenant_code:string, agent_name: string, shouldStop: () => boolean): Promise<number> {
      let processed = 0;
      const items = await this.getForSynchronization(tenant_code, agent_name);
      for (const item of items) {
         if (shouldStop()) {
            return processed;
         }
         try {
            const entity = await this.getById(item.jurisdiction_id, item._id);
            if (entity) {
               await this.calculateAndPersist(entity);
            }
            processed++;
         } catch (error) {
            this.logger.error('Account Sync Error', error);
         }
      }
      return processed;
   }

   async invalidate(jurisdiction_id: string, _id: string, agent_name?: string): Promise<void> {
      const filter: QueryFilter<Account> = {
         calculation_utc: { $ne: null },
         _id: _id
      };
      const update: UpdateQuery<Account> = {
         $set: {
            calculation_utc: null,
            calculation_agent: agent_name,
         },
      };
      await this._updateManyPartialIsolated(jurisdiction_id, filter, update);
   }

   async invalidateAll(jurisdiction_id: string, agent_name: string): Promise<void> {
      const filter: QueryFilter<Account> = {
         calculation_utc: { $ne: null },
         
      };
      const update: UpdateQuery<Account> = {
         $set: {
            calculation_utc: null,
            calculation_agent: agent_name,
         },
      };
      await this._updateManyPartialIsolated(jurisdiction_id, filter, update);
   }

   async calculateAndPersist(document:Account): Promise<void> {
      const utcNow = new Date();

      const calculations:Account.CalculationsPerspective = await this.calculate(document);
      
      await this.calculateSearchable(document);
      
      calculations.calculationMarkClean(utcNow);
      try
      {
         const filter = { _id: calculations._id };
         const update = {
            $set: {email_upper: calculations.email_upper,avatar: calculations.avatar,
               calculation_utc: calculations.calculation_utc,
               calculation_agent: calculations.calculation_agent,
               searchable: document.searchable,
            }
         };

         await this._updatePartialIsolated(calculations.jurisdiction_id, filter, update);
         
         
      }
      catch(exception: unknown) {
         calculations.calculationMarkDirty(this.defaultAgent, "calc_fail"); // don't allow callers to think we succeeded
         throw exception;
      }
   }

   private async getForSynchronization(tenant_code:string, agent_name:string):Promise<Account.Synchronization[]> {
      
      const filter: QueryFilter<Account> = {
         calculation_utc: null,
      };

      if (isNullOrWhiteSpace(agent_name)) {
         filter.calculation_agent = { $in: [null, ''] };
      } else {
         filter.calculation_agent = agent_name;
      }

      const data = await this._findTenant<Account.Synchronization>(Account.Synchronization, tenant_code, filter, Account.Synchronization.Projection, 0, MAX_INT_32);
      
      return data.items;
   }

   private async calculate(document:Account): Promise<Account.CalculationsPerspective> {
      const calculationSource:Account.CalculationSource = document.forCalculation();
      const calculations:Account.CalculationsPerspective = document.asCalculationsPerspective();

      await this.applyCalculations(calculationSource, calculations);
      
      return calculations;
   }
   

   protected async postProcessFindAs<TProjection>(data: ListResult<TProjection>) : Promise<ListResult<TProjection>> {
      return data;
   }
   protected async preProcessMutationDocument(document: Account, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationDocument(document: Account, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
   protected async preProcessMutationInfoPerspective(perspective: Account.InfoPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationInfoPerspective(perspective: Account.InfoPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
   protected async preProcessMutationStatusPerspective(perspective: Account.StatusPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationStatusPerspective(perspective: Account.StatusPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
   protected async preProcessMutationPermissionsPerspective(perspective: Account.PermissionsPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationPermissionsPerspective(perspective: Account.PermissionsPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
   protected async applyCalculations(source: Account.CalculationSource, destination:Account.CalculationsPerspective): Promise<void> {
      // for override customization
      // IMPORTANT: Use source.field for all calculation inputs. Do NOT use source.getActual()
      // to read fields — that bypasses change detection. If you need a field, add recalculate="true" in the XML.

      // Use the following ONLY to retrieve routing fields like jurisdiction_id
      // const jurisdiction_id:string = source.getActual().jurisdiction_id;
   }
   
}