import { Controller, Req, UseGuards, Post, ForbiddenException, NotFoundException, UnauthorizedException, Body, HttpCode, Logger } from '@nestjs/common';
import { StencilJWTPayload, StencilRequest } from 'src/shared/types/auth.types';
import { AuthGuard } from 'src/shared/access-control/auth.guard';
import { RateLimit } from 'src/shared/access-control/rate-limit.decorator';
import { RateLimitGuard } from 'src/shared/access-control/rate-limit.guard';
import { EntityRegistry } from 'src/entities/entity.registry';
import { Account } from 'src/entities/account/account.model';
import { ItemResult } from 'src/shared/types/data/item-result';
import { AccountStatus } from 'src/entities/enums/accountstatus';
import { isNullOrWhiteSpace } from 'src/shared/utils';
import { IAvatarRequest, AvatarRequest } from './models/avatarrequest';
import { INameRequest, NameRequest } from './models/namerequest';
import { Sanitize } from 'src/shared/utils/sanitized';
import { CloudStorageHandler } from 'src/features/platform/storage';
import { StorageUtils } from 'src/features/utils/storage.utils';

@Controller('v1/profile')
export class ProfileController {
   private readonly logger = new Logger(ProfileController.name);

   constructor(
      private readonly entities: EntityRegistry,
      private readonly cloudStorageHandler: CloudStorageHandler,
   ) {}

   @RateLimit({ points: 30, duration: 60 })
   @UseGuards(AuthGuard, RateLimitGuard)
   @Post('avatar')
   @HttpCode(200)
   async avatar(@Req() request: StencilRequest, @Body(Sanitize.for(AvatarRequest)) input: IAvatarRequest) {
      if (!request.account) {
         throw new ForbiddenException();
      }
      let account = await this.getAccountLive(request.auth!.payload);

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
      account = await this.getAccountLive(request.auth!.payload);

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
   async name(@Req() request: StencilRequest, @Body(Sanitize.for(NameRequest)) input: INameRequest) {
      if (!request.account) {
         throw new ForbiddenException();
      }
      let account = await this.getAccountLive(request.auth!.payload);

      if (input.display_name && !isNullOrWhiteSpace(input.display_name)) {
         const infoData = account.asInfoPerspective();
         infoData.display_name = input.display_name;
         await this.entities.accountManager.updateInfoPerspective(infoData);
      }

      // get the latest
      account = await this.getAccountLive(request.auth!.payload);

      await StorageUtils.hydrateAvatarUrls(this.cloudStorageHandler, account);

      const result: ItemResult<Account.Self> = {
         success: true,
         item: account.toSelf(),
      };
      return result;
   }

   async getAccountLive(jwtToken: StencilJWTPayload): Promise<Account> {
      // don't use a user cache for auth commands
      const globalAccount = await this.entities.globalAccountManager.getForAuthIdentifier(jwtToken.sub);
      if (!globalAccount?.jurisdiction_id) {
         throw new UnauthorizedException('unbound'); // 401 is important, the mobile app cancels the session when this happens.
      }
      const account = await this.entities.accountManager.getById(globalAccount.jurisdiction_id, globalAccount._id);
      if (!account) {
         throw new UnauthorizedException('missing'); // 401 is important, the mobile app cancels the session when this happens.
      }
      switch (account.account_status) {
      case AccountStatus.disabled:
         throw new UnauthorizedException('disabled'); // 401 is important, the mobile app cancels the session when this happens.
      case AccountStatus.enabled:
      default:
         return account;
      }
   }
}
