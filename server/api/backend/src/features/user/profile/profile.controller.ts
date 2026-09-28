import { Controller, Req, UseGuards, Post, ForbiddenException, NotFoundException, UnauthorizedException, Body, HttpCode } from '@nestjs/common';
import { AuthGuard } from 'src/shared/access-control/auth.guard';
import { RateLimit } from 'src/shared/access-control/rate-limit.decorator';
import { RateLimitGuard } from 'src/shared/access-control/rate-limit.guard';
import { AccountResolution, AccountResolver } from 'src/shared/access-control/account-resolver.service';
import { EntityRegistry } from 'src/entities/entity.registry';
import { Account } from 'src/entities/account/account.model';
import { ItemResult } from 'src/shared/types/data/item-result';
import { FeatureRequest } from 'src/shared/types/feature-request';
import { isNullOrWhiteSpace } from 'src/shared/utils';
import { IAvatarRequest, AvatarRequest } from './models/avatarrequest';
import { INameRequest, NameRequest } from './models/namerequest';
import { IProfileOperations } from './profile.operations';
import { Sanitize } from 'src/shared/utils/sanitized';
import { CloudStorageHandler } from 'src/features/platform/storage';
import { StorageUtils } from 'src/features/utils/storage.utils';

@Controller('v1/profile')
export class ProfileController implements IProfileOperations {
   constructor(
      private readonly entities: EntityRegistry,
      private readonly accounts: AccountResolver,
      private readonly cloudStorageHandler: CloudStorageHandler,
   ) {}

   @RateLimit({ points: 30, duration: 60 })
   @UseGuards(AuthGuard, RateLimitGuard)
   @Post('avatar')
   @HttpCode(200)
   async avatarUpdate(@Req() request: FeatureRequest, @Body(Sanitize.for(AvatarRequest)) input: IAvatarRequest): Promise<ItemResult<Account.Self>> {
      if (!request.account) {
         throw new ForbiddenException();
      }
      let account = await this.getAccountLive(request);

      if (input.asset_id && !isNullOrWhiteSpace(input.asset_id)) {
         // verify asset id owner matches (no theft allowed)
         const foundAsset = await this.entities.jurisdictionAssetManager.getById(request.account.jurisdiction_id, input.asset_id);
         if (!foundAsset || !foundAsset.available) {
            throw new NotFoundException();
         }
         if (foundAsset.account_id_creator !== undefined && foundAsset.account_id_creator !== request.account._id) {
            throw new NotFoundException();
         }
         const infoData = account.asInfoPerspective();
         infoData.asset_id_avatar = input.asset_id;
         await this.entities.accountManager.updateInfoPerspective(infoData);
      }

      // get the latest
      account = await this.getAccountLive(request);

      await StorageUtils.hydrateAvatarUrls(this.cloudStorageHandler, account);

      const result: ItemResult<Account.Self> = {
         success: true,
         item: account.toSelf(),
      };
      return result;
   }

   @RateLimit({ points: 30, duration: 60 })
   @UseGuards(AuthGuard, RateLimitGuard)
   @Post('name')
   @HttpCode(200)
   async nameUpdate(@Req() request: FeatureRequest, @Body(Sanitize.for(NameRequest)) input: INameRequest): Promise<ItemResult<Account.Self>> {
      if (!request.account) {
         throw new ForbiddenException();
      }
      let account = await this.getAccountLive(request);

      if (input.display_name && !isNullOrWhiteSpace(input.display_name)) {
         const infoData = account.asInfoPerspective();
         infoData.display_name = input.display_name;
         await this.entities.accountManager.updateInfoPerspective(infoData);
      }

      // get the latest
      account = await this.getAccountLive(request);

      await StorageUtils.hydrateAvatarUrls(this.cloudStorageHandler, account);

      const result: ItemResult<Account.Self> = {
         success: true,
         item: account.toSelf(),
      };
      return result;
   }

   /** Uncached account for auth commands. 401 is important: the mobile app cancels the session on it. */
   private async getAccountLive(request: FeatureRequest): Promise<Account> {
      const sub = request.auth?.payload.sub;
      if (!sub) {
         throw new UnauthorizedException('missing');
      }
      const { resolution, account } = await this.accounts.resolveLive(sub);
      if (resolution !== AccountResolution.resolved || !account) {
         throw new UnauthorizedException(resolution);
      }
      return account;
   }
}
