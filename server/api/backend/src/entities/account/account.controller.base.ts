import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { Account } from './account.model';
import { AccountManager } from './account.manager';
import { ListResult } from 'src/shared/types/data/list-result';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ActionResult } from 'src/shared/types/data/action-result';
import { AuthGuard, Permission } from 'src/shared/access-control/auth.guard';
import { AppPermissions } from 'src/shared/constants/permissions';
import { OptionalIntPipe, Sanitize } from 'src/shared/utils';
import { OptionalBoolPipe } from 'src/shared/utils/optional-bool.pipe';
import './account.sanitized.validators';
import { CloudStorageHandler } from 'src/features/platform/storage';
import { StorageUtils } from 'src/features/utils/storage.utils';


@Controller('admin/:jurisdiction_id/account')
@UseGuards(AuthGuard)
export class AccountControllerBase {
   constructor(protected readonly manager: AccountManager, protected readonly cloudStorageHandler: CloudStorageHandler,) {}

   @Get('find')
   @Permission(AppPermissions.Admin.Account.Read)
   async find(
      @Param('jurisdiction_id') jurisdiction_id: string,
      @Query('skip', OptionalIntPipe) skip: number = 0,
      @Query('take', OptionalIntPipe) take: number = 10,
      @Query('order_by') order_by?: string,
      @Query('descending', OptionalBoolPipe) descending: boolean = false,
      @Query('keyword') keyword?: string,
      @Query('asset_id_avatar') asset_id_avatar?: string
   ): Promise<ListResult<Account>> {
      const result:ListResult<Account> = await this.manager.find(jurisdiction_id, skip, take, keyword, order_by, descending, asset_id_avatar);
      await this.fillStorageSignatures(result);
      return result;
   }

   @Get(':_id')
   @Permission(AppPermissions.Admin.Account.Read)
   async get(@Param('jurisdiction_id') jurisdiction_id: string, @Param('_id') _id: string): Promise<ItemResult<Account>> {
      const data = await this.manager.getById(jurisdiction_id, _id);
      const result: ItemResult<Account> = {
         success: true,
         item: data,
      };
      await this.fillStorageSignature(result);
      return result;
   }

   @Post()
   @Permission(AppPermissions.Admin.Account.Write)
   async create(@Param('jurisdiction_id') jurisdiction_id: string, @Body(Sanitize.for(Account)) input: Account): Promise<ItemResult<Account>> {
      const data = await this.manager.insert(jurisdiction_id, input);
      const result: ItemResult<Account> = {
         success: true,
         item: data,
      };
      await this.fillStorageSignature(result);
      return result;
   }

   @Put(':_id')
   @Permission(AppPermissions.Admin.Account.Write)
   async update(@Param('jurisdiction_id') jurisdiction_id: string, @Param('_id') _id: string, @Body(Sanitize.for(Account)) input: Account): Promise<ItemResult<Account>> {
      const existing = await this.manager.getById(jurisdiction_id, _id);
      if (!existing) {
         throw new NotFoundException();
      }
      existing.fillFromPartial(input);
      const data = await this.manager.replace(jurisdiction_id, _id, existing);
      const result: ItemResult<Account> = {
         success: true,
         item: data,
      };
      await this.fillStorageSignature(result);
      return result;
   }

   @Delete(':_id')
   @Permission(AppPermissions.Admin.Account.Write)
   async delete(@Param('jurisdiction_id') jurisdiction_id: string, @Param('_id') _id: string): Promise<ActionResult> {
      const data = await this.manager.getById(jurisdiction_id, _id);
      if (data){
         await this.manager.delete(data);
      }
      const result: ActionResult = {
         success: true
      };
      return result;
   }

   
   protected async fillStorageSignatures(data: ListResult<Account>) : Promise<void> {
      if (!data?.items) { return; }
      for (const item of data.items) {
         await this.fillStorageSignatureForAccount(item);
      }
   }
   protected async fillStorageSignature(data: ItemResult<Account>) : Promise<void> {
      if (!data?.item) { return; }
      await this.fillStorageSignatureForAccount(data.item);
   }
   protected async fillStorageSignatureForAccount(data:Account) : Promise<void> {
      if (!data) { return; }
      
      await StorageUtils.hydrateAssetUrls(this.cloudStorageHandler, data.avatar);
      
   }
   
}