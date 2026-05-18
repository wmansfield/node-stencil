import { Controller, Req, UseGuards, Post, UnauthorizedException, NotFoundException, Body, HttpCode, Logger, Inject } from '@nestjs/common';
import { StencilJWTPayload, StencilRequest } from 'src/shared/types/auth.types';
import { AuthGuard, SkipAccountCreation } from 'src/shared/access-control/auth.guard';
import { RateLimit } from 'src/shared/access-control/rate-limit.decorator';
import { RateLimitGuard } from 'src/shared/access-control/rate-limit.guard';
import { AUTH_PROVIDER, IAuthProvider } from 'src/shared/access-control/auth-provider/auth-provider.interface';
import { LocalAuthProvider } from 'src/shared/access-control/auth-provider/local-auth.provider';
import { EntityRegistry } from 'src/entities/entity.registry';
import { Account } from 'src/entities/account/account.model';
import { ItemResult } from 'src/shared/types/data/item-result';
import { AccountStatus } from 'src/entities/enums/accountstatus';
import { IRegisterRequest, RegisterRequest } from './models/registerrequest';
import { Sanitize } from 'src/shared/utils/sanitized';
import { isNullOrWhiteSpace } from 'src/shared/utils';
import { StorageUtils } from 'src/features/utils/storage.utils';
import { CloudStorageHandler } from 'src/features/platform/storage';

@Controller('v1/auth')
export class AuthController {
   private readonly logger = new Logger(AuthController.name);

   constructor(
      private readonly entities: EntityRegistry,
      private readonly cloudStorageHandler: CloudStorageHandler,
      @Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider,
   ) {}

   @RateLimit({ points: 60, duration: 60 })
   @UseGuards(RateLimitGuard)
   @Post('self')
   @HttpCode(200)
   async getSelf(@Req() request: StencilRequest) {
      if (!request.auth?.payload?.sub) {
         throw new UnauthorizedException('missing');
      }

      const jwt = request.auth.payload;
      let jurisdictionId: string | undefined;
      let accountId: string | undefined;
      let claimsMissing = false;

      if (jwt.jurisdiction_id && jwt.account_id) {
         jurisdictionId = jwt.jurisdiction_id;
         accountId = jwt.account_id;
      } else {
         claimsMissing = true;
         const globalAccount = await this.entities.globalAccountManager.getForAuthIdentifier(jwt.sub);
         jurisdictionId = globalAccount?.jurisdiction_id;
         accountId = globalAccount?._id;
      }

      if (!jurisdictionId) {
         return { success: true, item: undefined } as ItemResult<Account.Self>;
      }

      const account = await this.entities.accountManager.getForAuthIdentifier(jurisdictionId, jwt.sub);
      if (!account || account.account_status !== AccountStatus.enabled) {
         return { success: true, item: undefined } as ItemResult<Account.Self>;
      }

      if (jwt.email && jwt.email_verified && jwt.email !== account.email) {
         this.logger.log(`Email reconciliation for ${jwt.sub.slice(0, 8)}***: ${account.email} → ${jwt.email}`);
         const statusData = account.asStatusPerspective();
         statusData.email = jwt.email;
         await this.entities.accountManager.updateStatusPerspective(statusData);
         account.email = jwt.email;
         account.email_upper = jwt.email.toUpperCase();
      }

      // Self-heal: if the JWT is missing claims, re-stamp them so future tokens carry them
      if (claimsMissing && account.jurisdiction_id && account._id) {
         this.logger.warn(`JWT missing claims for user ${jwt.sub.slice(0, 8)}*** — attempting to heal`);
         this.authProvider
            .setClaims(jwt.sub, { jurisdiction_id: account.jurisdiction_id, account_id: account._id })
            .then(ok => {
               if (!ok) {
                  this.logger.error(`Failed to heal claims for user ${jwt.sub.slice(0, 8)}***`);
               }
            })
            .catch(err => this.logger.error(`Error healing claims for user ${jwt.sub.slice(0, 8)}***: ${err}`));
      }

      await StorageUtils.hydrateAvatarUrls(this.cloudStorageHandler, account);

      const result: ItemResult<Account.Self> = {
         success: true,
         item: account.toSelf(),
      };
      return result;
   }

   @SkipAccountCreation()
   @RateLimit({ points: 10, duration: 60 })
   @UseGuards(AuthGuard, RateLimitGuard)
   @Post('register')
   @HttpCode(200)
   async register(@Req() request: StencilRequest, @Body(Sanitize.for(RegisterRequest)) input: IRegisterRequest) {
      if (!request.auth?.payload?.sub) {
         throw new UnauthorizedException('missing');
      }

      let account: Account;

      if (!request.account) {
         account = await this.createAccount(request, input);
      } else {
         account = await this.getAccountLive(request.auth!.payload);
      }

      // Enrich custom claims so future JWTs carry jurisdiction_id + account_id,
      // allowing AuthGuard to skip the GlobalAccount lookup entirely.
      // LocalAuthProvider silently no-ops this; FirebaseAuthProvider writes to Firebase.
      const needsClaims = !request.auth?.payload.jurisdiction_id || !request.auth?.payload.account_id;
      if (needsClaims && account.jurisdiction_id && account._id) {
         const claimsSet = await this.authProvider.setClaims(request.auth!.payload.sub, {
            jurisdiction_id: account.jurisdiction_id,
            account_id: account._id,
         });
         if (!claimsSet) {
            this.logger.warn(`Failed to set registration claims for user ${request.auth!.payload.sub.slice(0, 8)}*** — will retry on next getSelf`);
         }
      }

      if (input.display_name && !isNullOrWhiteSpace(input.display_name)) {
         const infoData = account.asInfoPerspective();
         infoData.display_name = input.display_name;
         await this.entities.accountManager.updateInfoPerspective(infoData);
      }

      account = await this.getAccountLive(request.auth!.payload);
      await StorageUtils.hydrateAvatarUrls(this.cloudStorageHandler, account);

      const result: ItemResult<Account.Self> = {
         success: true,
         item: account.toSelf(),
      };
      return result;
   }

   /**
    * Development-only token endpoint.
    *
    * Only available when LocalAuthProvider is active (i.e. FIREBASE_PROJECT_ID is not set).
    * Returns a signed HS256 JWT that can be used as a Bearer token for all other endpoints.
    *
    * Credentials are validated against DEV_AUTH_USER / DEV_AUTH_PASS env vars
    * (defaults: "dev" / "dev-secret").
    */
   @RateLimit({ points: 10, duration: 60 })
   @UseGuards(RateLimitGuard)
   @Post('dev-token')
   @HttpCode(200)
   async devToken(@Body() body: { username?: string; password?: string; sub?: string; email?: string }) {
      if (!(this.authProvider instanceof LocalAuthProvider)) {
         throw new NotFoundException();
      }

      const expectedUser = process.env.DEV_AUTH_USER ?? 'dev';
      const expectedPass = process.env.DEV_AUTH_PASS ?? 'dev-secret';

      if (body.username !== expectedUser || body.password !== expectedPass) {
         throw new UnauthorizedException('invalid credentials');
      }

      const sub = body.sub ?? body.username;
      const email = body.email ?? `${sub}@dev.local`;
      const token = await this.authProvider.mintToken(sub!, email);

      return { token };
   }

   private async createAccount(request: StencilRequest, input: IRegisterRequest): Promise<Account> {
      const jwt = request.auth!.payload;

      let globalAccount = await this.entities.globalAccountManager.getForAuthIdentifier(jwt.sub);
      if (!globalAccount) {
         globalAccount = await this.entities.globalAccountManager.ensureFromRequestCached(request);
         if (!globalAccount) {
            throw new UnauthorizedException('unfound');
         }
      }

      const insert = new Account({
         _id: globalAccount._id,
         auth_identifier: jwt.sub,
         jurisdiction_id: globalAccount.jurisdiction_id,
         email: jwt.email,
         account_status: AccountStatus.enabled,
         display_name: jwt.name ?? input.display_name,
         email_upper: jwt.email?.toUpperCase() || '',
         joined_utc: new Date(),
         auth_provider: jwt.auth_provider ?? 'password',
      });

      try {
         return await this.entities.accountManager.insert(globalAccount.jurisdiction_id, insert);
      } catch (error: any) {
         if (error?.code === 11000 || error?.message?.includes('duplicate key')) {
            this.logger.debug(`Concurrent account creation for ${jwt.sub.slice(0, 8)}***, fetching existing`);
            return await this.getAccountLive(jwt);
         }
         throw error;
      }
   }

   async getAccountLive(jwtToken: StencilJWTPayload): Promise<Account> {
      let jurisdictionId: string | undefined;
      let accountId: string | undefined;

      if (jwtToken.jurisdiction_id && jwtToken.account_id) {
         jurisdictionId = jwtToken.jurisdiction_id;
         accountId = jwtToken.account_id;
      } else {
         const globalAccount = await this.entities.globalAccountManager.getForAuthIdentifier(jwtToken.sub);
         jurisdictionId = globalAccount?.jurisdiction_id;
         accountId = globalAccount?._id;
      }

      if (!jurisdictionId || !accountId) {
         throw new UnauthorizedException('unbound');
      }
      const account = await this.entities.accountManager.getById(jurisdictionId, accountId);
      if (!account) {
         throw new UnauthorizedException('missing');
      }
      switch (account.account_status) {
         case AccountStatus.disabled:
            throw new UnauthorizedException('disabled');
         case AccountStatus.enabled:
         default:
            return account;
      }
   }
}
