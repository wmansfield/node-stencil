import { Injectable, Inject } from '@nestjs/common';
import { Account } from './account.model';
import { AccountManagerBase } from './account.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';
import { StencilRequest } from 'src/shared/types/auth.types';
import { QueryFilter } from 'mongoose';
import { AUTH_PROVIDER, IAuthProvider } from 'src/shared/access-control/auth-provider/auth-provider.interface';
import { DocumentOperation } from '../common/document-operation';

@Injectable()
export class AccountManager extends AccountManagerBase {
   private readonly authProvider: IAuthProvider;

   constructor(
      connectionProvider: MongoConnectionProvider,
      entities: EntityRegistry,
      dependencyCoordinator: DependencyCoordinator,
      memoryCache: MemoryCache,
      @Inject(AUTH_PROVIDER) authProvider: IAuthProvider,
   ) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
      this.authProvider = authProvider;
   }

   async getForAuthIdentifier(jurisdiction_id: string, auth_identifier: string): Promise<Account | undefined> {
      const filter: QueryFilter<Account> = { auth_identifier: auth_identifier };
      const result = await this._findOneIsolated<Account>(Account, jurisdiction_id, filter, Account.Projection);
      return result;
   }

   async ensureFromRequestCached(jurisdiction_id: string, request: StencilRequest): Promise<Account.Self | undefined> {
      const jwt = request?.auth?.payload;

      if (!jwt?.sub) {
         this.logger.warn('AccountManager:ensureFromRequestCached failed, no sub');
         return undefined;
      }

      const cached = await this.memoryCache.getOrFetch1(`AccountManager:ensureFromRequestCached:${jwt.sub}`, async () => {
         return await this.resolveFromRequest(jurisdiction_id, jwt.sub);
      });
      if (cached.fromCache && !cached.value) {
         return await this.resolveFromRequest(jurisdiction_id, jwt.sub);
      }
      return cached.value;
   }

   private async resolveFromRequest(jurisdiction_id: string, sub: string): Promise<Account.Self | undefined> {
      const account = await this.getForAuthIdentifier(jurisdiction_id, sub);
      return account?.toSelf();
   }

   protected async applyCalculations(source: Account.CalculationSource, destination: Account.CalculationsPerspective): Promise<void> {
      const jurisdiction_id: string = source.getActual().jurisdiction_id;
      if (source.email) {
         destination.email_upper = source.email.toUpperCase();
      }
      if (source.asset_id_avatar) {
         const asset = await this.entities.jurisdictionAssetManager.getById(jurisdiction_id, source.asset_id_avatar);
         destination.avatar = asset?.toInfo();
      }
   }

   /**
    * Sync roles to provider custom claims when permissions are updated.
    */
   protected override async postProcessMutationPermissionsPerspective(
      perspective: Account.PermissionsPerspective,
      documentOperation: DocumentOperation,
   ): Promise<void> {
      const account = perspective.getActual();
      if (account.auth_identifier) {
         await this.authProvider.setClaims(account.auth_identifier, { roles: perspective.roles });
      }
   }

   /**
    * Cascade account_status changes to the identity provider.
    * Values < 0 revoke the user; values >= 0 re-enable them.
    */
   protected override async postProcessMutationStatusPerspective(
      perspective: Account.StatusPerspective,
      documentOperation: DocumentOperation,
   ): Promise<void> {
      const account = perspective.getActual();
      if (!account.auth_identifier) {
         return;
      }

      if (perspective.account_status < 0) {
         await this.authProvider.revokeUser(account.auth_identifier);
      } else {
         await this.authProvider.reEnableUser(account.auth_identifier);
      }
   }

   async findByEmail(jurisdiction_id: string, email: string): Promise<Account | undefined> {
      const filter: QueryFilter<Account> = { email_upper: email.toUpperCase() };
      return this._findOneIsolated<Account>(Account, jurisdiction_id, filter, Account.Projection);
   }

   async deleteForDeletion(jurisdiction_id: string, account_id: string): Promise<boolean> {
      return this._deleteIsolated(jurisdiction_id, account_id);
   }
}
