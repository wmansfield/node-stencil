import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MongoManagerIsolated } from 'src/shared/managers/mongo-manager.isolated';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { Widget } from './widget.model';
import { QueryFilter, ProjectionFields, SortOrder, UpdateQuery } from 'mongoose';
import type { Document } from 'bson';
import { COLLECTION_NAME, PRIMARY_KEY } from './widget.schema';
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
export class WidgetManagerBase extends MongoManagerIsolated<Widget> implements SynchronizableEntityIsolated {
   protected readonly logger = new Logger(WidgetManagerBase.name);

   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache: MemoryCache) {
      super(COLLECTION_NAME, PRIMARY_KEY, connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async validateExistence(jurisdiction_id:string, _id:string) {
      const found = await this._retrieveIsolated<Widget>(Widget, jurisdiction_id, _id, { _id: 1 });
      
      if (!found) {
         throw new UIException(LocalizableString.General_InvalidReference("Widget"));
      }
   }
   
   
   async anyWithJurisdiction(jurisdiction_id:string | undefined): Promise<boolean>{
      if (!jurisdiction_id){
         return false;
      }
      const filter: QueryFilter<Widget> = {
         jurisdiction_id: jurisdiction_id
      };

      const found = await this._findIsolated<Widget>(Widget, jurisdiction_id, filter, { _id: 1 }, 0, 1, undefined, false);
      return found.items.length > 0;
   }
   
   async anyWithMediaAsset(jurisdiction_id:string, asset_id_media:string | undefined): Promise<boolean>{
      if (!asset_id_media){
         return false;
      }
      const filter: QueryFilter<Widget> = {
         jurisdiction_id: jurisdiction_id,
         asset_id_media: asset_id_media
      };

      const found = await this._findIsolated<Widget>(Widget, jurisdiction_id, filter, { _id: 1 }, 0, 1, undefined, false);
      return found.items.length > 0;
   }
   

   async getById(jurisdiction_id: string, _id: string): Promise<Widget | undefined> {
      const result = this._retrieveIsolated<Widget>(Widget, jurisdiction_id, _id, Widget.Projection);
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
         const orFilter = BatchUtils.createOrFilter<Widget>(ids, '_id');
         const filter: QueryFilter<Widget> = {
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
      asset_id_media?: string
   ): Promise<ListResult<Widget>> {
      return await this.findAs<Widget>(
         Widget,
         Widget.Projection,
         jurisdiction_id, 
         skip, 
         take,
         keyword,
         order_by, 
         descending,
         asset_id_media
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
      asset_id_media?: string
   ): Promise<ListResult<TProjection>> {
      const filter: QueryFilter<Widget> = {
         jurisdiction_id: jurisdiction_id,
      };
      
      if(asset_id_media !== undefined && asset_id_media !== null) {
         filter.asset_id_media = asset_id_media;
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

   
   async insert(jurisdiction_id: string, document: Widget): Promise<Widget> {
      if (jurisdiction_id != document.jurisdiction_id) {
         throw new ConflictException("jurisdiction_id mismatch");
      }
      
      if (!document._id) {
         document._id = uuidv4();
      }
      
      document.created_utc = new Date();
      document.updated_utc = document.created_utc;

      await this.preProcessMutationDocument(document, DocumentOperation.insert);
      await this.preProcessMutationConfigPerspective(document.asConfigPerspective(), DocumentOperation.insert);
      
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      document.calculationMarkDirty(this.defaultAgent, "replace");
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      if (!!document.asset_id_media) {
         await this.entities.jurisdictionAssetManager.validateExistence(document.jurisdiction_id, document.asset_id_media);
      }
      
      await this._insertIsolated(Widget, jurisdiction_id, document);
      
      await this.calculateAndPersist(document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.insert);
      await this.postProcessMutationConfigPerspective(document.asConfigPerspective(), DocumentOperation.insert);
      
      await this.dependencyCoordinator.markInvalidated("Widget", document);

      return document;
   }

   async replace(jurisdiction_id: string, _id: string, document: Widget): Promise<Widget> {
      if (jurisdiction_id != document.jurisdiction_id) {
         throw new ConflictException("jurisdiction_id mismatch");
      }
      
      document.updated_utc = new Date();

      await this.preProcessMutationDocument(document, DocumentOperation.replace);
      await this.preProcessMutationConfigPerspective(document.asConfigPerspective(), DocumentOperation.replace);
      
      await this.calculateSearchable(document);
      
      await this.sanitize(document);
      
      await this.validate(document);
      
      document.calculationMarkDirty(this.defaultAgent, "replace");
      
      await this.entities.jurisdictionManager.validateExistence(document.jurisdiction_id);
      if (!!document.asset_id_media) {
         await this.entities.jurisdictionAssetManager.validateExistence(document.jurisdiction_id, document.asset_id_media);
      }
      
      
      const unset: string[] | undefined = this.determineRemovableFieldsDocument(document);

      await this._upsertIsolated(Widget, jurisdiction_id, _id, document, unset);
      
      await this.calculateAndPersist(document);
      
      await this.postProcessMutationDocument(document, DocumentOperation.replace);
      await this.postProcessMutationConfigPerspective(document.asConfigPerspective(), DocumentOperation.replace);
      
      await this.dependencyCoordinator.markInvalidated("Widget", document);

      return document;

   }

   

   async delete(document: Widget): Promise<boolean> {
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
   
   async updateConfigPerspective(perspective: Widget.ConfigPerspective){
      const actual = perspective.getActual();

      await this.preProcessMutationConfigPerspective(perspective, DocumentOperation.updatePerspective);
      
      await this.sanitizeConfigPerspective(perspective);
      
      await this.validateConfigPerspective(perspective);
      
      await this.calculateSearchable(actual);
      
      actual.calculationMarkDirty(this.defaultAgent, "update_ConfigPerspective");
      const filter = { _id: perspective._id };
      const update: UpdateQuery<Widget>  = {
         $set: {
            updated_utc: new Date(),
            searchable: actual.searchable,
            title_localized: perspective.title_localized,
            description: perspective.description,
            description_localized: perspective.description_localized
         }
      };
      const removableFields = this.determineRemovableFieldsConfigPerspective(perspective);
      if (removableFields) {
         update.$unset = removableFields;
      }

      const result = await this._updatePartialIsolated(perspective.jurisdiction_id, filter, update);
      
      await this.calculateAndPersist(perspective.getActual());
      
      if (result.matchedCount > 0) {
         await this.postProcessMutationConfigPerspective(perspective, DocumentOperation.updatePerspective);
      }
      
      return result.matchedCount > 0;
   }

   protected determineRemovableFieldsConfigPerspective(perspective: Widget.ConfigPerspective): Record<string, 1> | undefined {
      if (!perspective){
         return; // sanity
      }

      // Check all nullable perspective fields for unset (handles both primitives and classes)
      const fieldsToRemove:string[] = [];
      
      if (perspective.title_localized === undefined) {
         fieldsToRemove.push("title_localized");
      }
      if (perspective.description === undefined) {
         fieldsToRemove.push("description");
      }
      if (perspective.description_localized === undefined) {
         fieldsToRemove.push("description_localized");
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

   protected determineRemovableFieldsDocument(document: Widget): string[] | undefined {
      if (!document){
         return; // sanity
      }
      const fieldsToRemove:string[] = [];
      
      // Check all nullable fields for unset (handles both primitives and classes)
      if (document.asset_id_media === undefined) {
         fieldsToRemove.push('asset_id_media');
      }
      if (document.title_localized === undefined) {
         fieldsToRemove.push('title_localized');
      }
      if (document.description === undefined) {
         fieldsToRemove.push('description');
      }
      if (document.description_localized === undefined) {
         fieldsToRemove.push('description_localized');
      }
      if (document.published_date === undefined) {
         fieldsToRemove.push('published_date');
      }
      if (document.reference === undefined) {
         fieldsToRemove.push('reference');
      }
      
      // Empty Guids
      if (document.asset_id_media === undefined || document.asset_id_media === '') {
         fieldsToRemove.push('asset_id_media');
      }
      
      return fieldsToRemove;
   }

   /**
    * Only allow sorting by known indexed fields
    */
   protected applySafeSort(sorts:SortInfo[]) : [string, SortOrder][] {
      const result: [string, SortOrder][] = [];

      const allowedFields = ['title', 'description'];
      
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

   protected async sanitize(document: Widget) : Promise<void> {
      Widget.sanitize(document);
   }
   
   protected async sanitizeConfigPerspective(perspective:Widget.ConfigPerspective) {
      
      perspective.description = sanitizeHtml(perspective.description, false);
   }
   

   protected async validate(document: Widget): Promise<void> {
      // Fields
      
      if (!document._id || !uuidValidate(document._id)) {
         throw new UIException(LocalizableString.General_FieldRequired("widget._id"));
      }
      
      if (isNullOrWhiteSpace(document.jurisdiction_id)) {
         throw new UIException(LocalizableString.General_FieldRequired("widget.jurisdiction_id"));
      }
      
      if (isNullOrWhiteSpace(document.title)) {
         throw new UIException(LocalizableString.General_FieldRequired("widget.title"));
      }
      
      if (document.jurisdiction_id && document.jurisdiction_id.length > 10) {
         throw new UIException(LocalizableString.General_FieldMaxLength(10, "widget.jurisdiction_id"));
      }
      
      if (document.title && document.title.length > 200) {
         throw new UIException(LocalizableString.General_FieldMaxLength(200, "widget.title"));
      }
      
   }

   
   protected async validateConfigPerspective(document: Widget.ConfigPerspective): Promise<void> {
      
   }
   
   protected async calculateSearchable(document: Widget) : Promise<void> {
      document.searchable = SEARCHABLE_DIVIDER;
      
      if (!isNullOrWhiteSpace(document.title)) {
         document.searchable += document.title!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
      if (!isNullOrWhiteSpace(document.description)) {
         document.searchable += document.description!.toLowerCase() + SEARCHABLE_DIVIDER;
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
            this.logger.error('Widget Sync Error', error);
         }
      }
      return processed;
   }

   async invalidate(jurisdiction_id: string, _id: string, agent_name?: string): Promise<void> {
      const filter: QueryFilter<Widget> = {
         calculation_utc: { $ne: null },
         _id: _id
      };
      const update: UpdateQuery<Widget> = {
         $set: {
            calculation_utc: null,
            calculation_agent: agent_name,
         },
      };
      await this._updateManyPartialIsolated(jurisdiction_id, filter, update);
   }

   async invalidateAll(jurisdiction_id: string, agent_name: string): Promise<void> {
      const filter: QueryFilter<Widget> = {
         calculation_utc: { $ne: null },
         
      };
      const update: UpdateQuery<Widget> = {
         $set: {
            calculation_utc: null,
            calculation_agent: agent_name,
         },
      };
      await this._updateManyPartialIsolated(jurisdiction_id, filter, update);
   }

   async calculateAndPersist(document:Widget): Promise<void> {
      const utcNow = new Date();

      const calculations:Widget.CalculationsPerspective = await this.calculate(document);
      
      await this.calculateSearchable(document);
      
      calculations.calculationMarkClean(utcNow);
      try
      {
         const filter = { _id: calculations._id };
         const update = {
            $set: {media: calculations.media,avatar: calculations.avatar,
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

   private async getForSynchronization(tenant_code:string, agent_name:string):Promise<Widget.Synchronization[]> {
      
      const filter: QueryFilter<Widget> = {
         calculation_utc: null,
      };

      if (isNullOrWhiteSpace(agent_name)) {
         filter.calculation_agent = { $in: [null, ''] };
      } else {
         filter.calculation_agent = agent_name;
      }

      const data = await this._findTenant<Widget.Synchronization>(Widget.Synchronization, tenant_code, filter, Widget.Synchronization.Projection, 0, MAX_INT_32);
      
      return data.items;
   }

   private async calculate(document:Widget): Promise<Widget.CalculationsPerspective> {
      const calculationSource:Widget.CalculationSource = document.forCalculation();
      const calculations:Widget.CalculationsPerspective = document.asCalculationsPerspective();

      await this.applyCalculations(calculationSource, calculations);
      
      return calculations;
   }
   

   protected async postProcessFindAs<TProjection>(data: ListResult<TProjection>) : Promise<ListResult<TProjection>> {
      return data;
   }
   protected async preProcessMutationDocument(document: Widget, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationDocument(document: Widget, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
   protected async preProcessMutationConfigPerspective(perspective: Widget.ConfigPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   protected async postProcessMutationConfigPerspective(perspective: Widget.ConfigPerspective, documentOperation: DocumentOperation): Promise<void> {
      // for override customization
   }
   
   protected async applyCalculations(source: Widget.CalculationSource, destination:Widget.CalculationsPerspective): Promise<void> {
      // for override customization
      // IMPORTANT: Use source.field for all calculation inputs. Do NOT use source.getActual()
      // to read fields — that bypasses change detection. If you need a field, add recalculate="true" in the XML.

      // Use the following ONLY to retrieve routing fields like jurisdiction_id
      // const jurisdiction_id:string = source.getActual().jurisdiction_id;
   }
   
}