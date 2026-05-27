import { Injectable } from '@nestjs/common';
import { JurisdictionAsset } from './jurisdictionasset.model';
import { JurisdictionAssetManagerBase } from './jurisdictionasset.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';
import { DocumentOperation } from '../common/document-operation';
import { AssetDependency } from '../enums/assetdependency';

@Injectable()
export class JurisdictionAssetManager extends JurisdictionAssetManagerBase {
   constructor(
      connectionProvider: MongoConnectionProvider,
      entities: EntityRegistry,
      dependencyCoordinator: DependencyCoordinator,
      memoryCache: MemoryCache
   ) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   /**
    * Find assets that need image resizing.
    * Returns assets where resize_required=true, available=true, and resize_attempts < maxAttempts.
    * Excludes assets that were attempted recently (within cooldownMinutes).
    */
   async findAssetsNeedingResize(
      jurisdiction_id: string,
      limit: number = 50,
      maxAttempts: number = 3,
      cooldownMinutes: number = 5
   ): Promise<JurisdictionAsset[]> {
      const cooldownCutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);

      const result = await this._findIsolated(
         JurisdictionAsset,
         jurisdiction_id,
         {
            resize_required: true,
            available: true,
            $and: [
               {
                  $or: [{ resize_attempts: { $lt: maxAttempts } }, { resize_attempts: { $exists: false } }],
               },
               {
                  $or: [{ resize_attempt_utc: { $lt: cooldownCutoff } }, { resize_attempt_utc: { $exists: false } }],
               },
            ],
         },
         JurisdictionAsset.Projection,
         0,
         limit,
         { created_utc: 1 },
         false
      );

      return result.items;
   }

   /**
    * Find assets that were prepared but never completed or bound,
    * older than the given cutoff date.
    */
   async findStaleOrphans(jurisdiction_id: string, cutoffDate: Date, limit: number = 100): Promise<JurisdictionAsset[]> {
      const result = await this._findIsolated(
         JurisdictionAsset,
         jurisdiction_id,
         {
            available: false,
            created_utc: { $lt: cutoffDate },
         },
         JurisdictionAsset.Projection,
         0,
         limit,
         { created_utc: 1 },
         false
      );

      return result.items;
   }

   protected async postProcessMutationProcessPerspective(perspective: JurisdictionAsset.ProcessPerspective, documentOperation: DocumentOperation): Promise<void> {
      switch (documentOperation) {
         case DocumentOperation.updatePerspective:
            if (perspective.dependency_id) {
               switch (perspective.dependency) {
                  case AssetDependency.account:
                     await this.entities.accountManager.invalidate(perspective.jurisdiction_id, perspective.dependency_id);
                     break;
                  default:
                     break;
               }
            }
            break;
         default:
            break;
      }
   }

   async listAllForAccount(jurisdiction_id: string, account_id: string): Promise<JurisdictionAsset[]> {
      const result = await this._findIsolated<JurisdictionAsset>(
         JurisdictionAsset,
         jurisdiction_id,
         { account_id_creator: account_id },
         { _id: 1, storage_key: 1 },
         0,
         10000,
         undefined,
         false,
      );
      return result.items;
   }

   async deleteAllForAccount(jurisdiction_id: string, account_id: string): Promise<number> {
      const model = await this.getIsolatedModel(jurisdiction_id);
      const result = await model.deleteMany({ account_id_creator: account_id });
      return result.deletedCount;
   }
}
