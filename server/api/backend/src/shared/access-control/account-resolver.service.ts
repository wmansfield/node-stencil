import { Injectable } from '@nestjs/common';
import { EntityRegistry } from 'src/entities/entity.registry';
import { Account } from 'src/entities/account/account.model';
import { AccountStatus } from 'src/entities/enums/accountstatus';

export enum AccountResolution {
   resolved = 'resolved',
   unbound = 'unbound',
   missing = 'missing',
   disabled = 'disabled',
}

export interface AccountResolutionResult {
   resolution: AccountResolution;
   account?: Account;
}

/**
 * Uncached lookup of the live account for an auth identifier (the identity provider `sub`).
 * Used where a cached AuthGuard account is not appropriate: auth commands and calls that
 * arrive through the MCP gateway.
 */
@Injectable()
export class AccountResolver {
   constructor(private readonly entities: EntityRegistry) {}

   async resolveLive(auth_identifier: string): Promise<AccountResolutionResult> {
      const globalAccount = await this.entities.globalAccountManager.getForAuthIdentifier(auth_identifier);
      if (!globalAccount?.jurisdiction_id) {
         return { resolution: AccountResolution.unbound };
      }
      const account = await this.entities.accountManager.getById(globalAccount.jurisdiction_id, globalAccount._id);
      if (!account) {
         return { resolution: AccountResolution.missing };
      }
      if (account.account_status !== AccountStatus.enabled) {
         return { resolution: AccountResolution.disabled };
      }
      return { resolution: AccountResolution.resolved, account };
   }
}
