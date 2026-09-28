import { FeatureRequest } from 'src/shared/types/feature-request';
import { ItemResult } from 'src/shared/types/data/item-result';
import { Account } from 'src/entities/account/account.model';
import { INameRequest } from './models/namerequest';
import { IAvatarRequest } from './models/avatarrequest';

/**
 * Operations of the profile feature that are exposed as MCP tools, implemented by
 * ProfileController. Members use property form so the compiler rejects an implementation
 * that takes the wider StencilRequest: MCP supplies only a FeatureRequest.
 */
export interface IProfileOperations {
   nameUpdate: (request: FeatureRequest, input: INameRequest) => Promise<ItemResult<Account.Self>>;
   avatarUpdate: (request: FeatureRequest, input: IAvatarRequest) => Promise<ItemResult<Account.Self>>;
}