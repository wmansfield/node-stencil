import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityRegistry } from 'src/entities/entity.registry';
import { StencilRequest } from '../types/auth.types';
import { AccountStatus } from 'src/entities/enums/accountstatus';

export const PERMISSION_KEY = 'permission';
export const Permission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);

export const SKIP_ACCOUNT_CREATION_KEY = 'skipAccountCreation';
export const SkipAccountCreation = () => SetMetadata(SKIP_ACCOUNT_CREATION_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
   private readonly logger = new Logger(AuthGuard.name);

   constructor(
      private readonly reflector: Reflector,
      private readonly entities: EntityRegistry
   ) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<StencilRequest>();

      if (request.method === 'OPTIONS') {
         return true;
      }

      // Step 1: JWT Authentication
      if (!request.auth?.payload?.sub) {
         throw new UnauthorizedException('missing');
      }

      // Step 2: Resolve Account
      const skipAccountCreation = this.reflector.get<boolean>(SKIP_ACCOUNT_CREATION_KEY, context.getHandler());
      if (!request.account_resolved) {
         request.account_resolved = new Date();

         const jwt = request.auth.payload;
         const hasJwtShortcut = !!(jwt.jurisdiction_id && jwt.account_id);

         if (skipAccountCreation) {
            const jurisdictionId = hasJwtShortcut
               ? jwt.jurisdiction_id!
               : (await this.entities.globalAccountManager.getForAuthIdentifier(jwt.sub))?.jurisdiction_id;

            if (jurisdictionId) {
               const account = await this.entities.accountManager.getForAuthIdentifier(jurisdictionId, jwt.sub);
               if (account?.account_status === AccountStatus.enabled) {
                  request.account = account.toSelf();
               }
            }
         } else if (hasJwtShortcut) {
            const account = await this.entities.accountManager.ensureFromRequestCached(jwt.jurisdiction_id!, request);
            if (account) {
               switch (account.account_status) {
               case AccountStatus.enabled:
                  request.account = account;
                  break;
               case AccountStatus.disabled:
                  return false;
               default:
                  this.logger.error(`Account status not yet supported: ${account.account_status})`);
                  return false;
               }
            } else {
               this.logger.warn('Account not found, registration required.');
               return false;
            }
         } else {
            const globalAccount = await this.entities.globalAccountManager.ensureFromRequestCached(request);
            if (!globalAccount) {
               this.logger.warn('GlobalAccount not found, registration required.');
               return false;
            }
            const account = await this.entities.accountManager.ensureFromRequestCached(globalAccount.jurisdiction_id, request);
            if (account) {
               switch (account.account_status) {
               case AccountStatus.enabled:
                  request.account = account;
                  break;
               case AccountStatus.disabled:
                  return false;
               default:
                  this.logger.error(`Account status not yet supported: ${account.account_status})`);
                  return false;
               }
            } else {
               this.logger.warn('Account not found, registration required.');
               return false;
            }
         }
      }

      // Step 3: Check Required Permissions
      const requiredPermission = this.reflector.get<string>(PERMISSION_KEY, context.getHandler());
      if (requiredPermission) {
         const hasPermission = await this.entities.roleManager.hasPermissionCached(requiredPermission, request.account?.roles);

         if (!hasPermission) {
            this.logger.warn(
               `Access Denied: User ${request.auth.payload.sub} is trying to access ${request.path} that requires permission: ${requiredPermission}`
            );
            throw new ForbiddenException('Access denied');
         }
      }

      return true;
   }
}
