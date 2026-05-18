import { Injectable, Logger } from '@nestjs/common';
import { GlobalAccount } from './globalaccount.model';
import { GlobalAccountManagerBase } from './globalaccount.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';
import { StencilRequest } from 'src/shared/types/auth.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GlobalAccountManager extends GlobalAccountManagerBase {
   constructor(
      connectionProvider: MongoConnectionProvider,
      entities: EntityRegistry,
      dependencyCoordinator: DependencyCoordinator,
      memoryCache: MemoryCache
   ) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async ensureFromRequestCached(request: StencilRequest): Promise<GlobalAccount | undefined> {
      const jwt = request?.auth?.payload;

      if (!jwt?.sub) {
         this.logger.warn('GlobalAccountManager:ensureFromRequestCached failed, no sub');
         return undefined;
      }

      const safeId = jwt.sub.slice(0, 8) + '***';
      const cached = await this.memoryCache.getOrFetch1(`GlobalAccountManager:ensureFromRequestCached:${jwt.sub}`, async () => {
         return await this.ensureFromRequest(request);
      });
      if (cached.fromCache && !cached.value) {
         this.logger.warn(`GlobalAccountManager:ensureFromRequestCached:${safeId} failed, retrying`);
         return await this.ensureFromRequest(request);
      }
      return cached.value;
   }

   async deleteByAuthIdentifier(auth_identifier: string): Promise<boolean> {
      const existing = await this.getForAuthIdentifier(auth_identifier);
      if (!existing) return false;
      return this._deleteShared(existing._id);
   }

   private async ensureFromRequest(request: StencilRequest): Promise<GlobalAccount | undefined> {
      const jwt = request?.auth?.payload;
      if (!jwt?.sub) {
         return undefined;
      }
      try {
         // ensure account
         let globalAccount = await this.getForAuthIdentifier(jwt.sub);
         if (!globalAccount) {
            // Resolve jurisdiction: prefer JWT custom claim, fallback to header
            // JWT claim is set during registration and appears in subsequent tokens
            // Header is used for the initial session before token refresh
            let jurisdictionId = jwt.jurisdiction_id || request?.jurisdiction_id;

            if (!jurisdictionId) {
               this.logger.warn('A new user request was made without a jurisdiction chosen.');
               return undefined;
            }

            // The auth payload was already verified by JwtAuthMiddleware — use it directly.
            if (!jwt.sub) {
               return undefined;
            }
            const insert = new GlobalAccount({
               _id: uuidv4(),
               auth_identifier: jwt.sub,
               jurisdiction_id: jurisdictionId,
            });
            try {
               globalAccount = await this.insert(insert);
            } catch (error) {
               this.logger.error(`Error creating globalaccount for subject: ${jwt.sub.slice(0, 8)}***. Error: ${error}`);
               // could be concurrency/race, try again
               globalAccount = await this.getById(jwt.sub);
            }
         }

         return globalAccount;
      } catch (error) {
         this.logger.error(`Error resolving account for subject: ${jwt.sub.slice(0, 8)}***. Error: ${error}`);
         throw error; // errors short circuit
      }
   }
}
