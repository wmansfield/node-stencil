import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { JurisdictionAsset } from './jurisdictionasset.model';
import { JurisdictionAssetManager } from './jurisdictionasset.manager';
import { ListResult } from 'src/shared/types/data/list-result';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ActionResult } from 'src/shared/types/data/action-result';
import { AuthGuard, Permission } from 'src/shared/access-control/auth.guard';
import { AppPermissions } from 'src/shared/constants/permissions';
import { OptionalIntPipe, Sanitize } from 'src/shared/utils';
import { OptionalBoolPipe } from 'src/shared/utils/optional-bool.pipe';
import './jurisdictionasset.sanitized.validators';


@Controller('admin/:jurisdiction_id/jurisdictionasset')
@UseGuards(AuthGuard)
export class JurisdictionAssetControllerBase {
   constructor(protected readonly manager: JurisdictionAssetManager, ) {}

   @Get('find')
   @Permission(AppPermissions.Admin.JurisdictionAsset.Read)
   async find(
      @Param('jurisdiction_id') jurisdiction_id: string,
      @Query('skip', OptionalIntPipe) skip: number = 0,
      @Query('take', OptionalIntPipe) take: number = 10,
      @Query('order_by') order_by?: string,
      @Query('descending', OptionalBoolPipe) descending: boolean = false,
      @Query('keyword') keyword?: string
   ): Promise<ListResult<JurisdictionAsset>> {
      const result:ListResult<JurisdictionAsset> = await this.manager.find(jurisdiction_id, skip, take, keyword, order_by, descending);
      
      return result;
   }

   @Get(':_id')
   @Permission(AppPermissions.Admin.JurisdictionAsset.Read)
   async get(@Param('jurisdiction_id') jurisdiction_id: string, @Param('_id') _id: string): Promise<ItemResult<JurisdictionAsset>> {
      const data = await this.manager.getById(jurisdiction_id, _id);
      const result: ItemResult<JurisdictionAsset> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Post()
   @Permission(AppPermissions.Admin.JurisdictionAsset.Write)
   async create(@Param('jurisdiction_id') jurisdiction_id: string, @Body(Sanitize.for(JurisdictionAsset)) input: JurisdictionAsset): Promise<ItemResult<JurisdictionAsset>> {
      const data = await this.manager.insert(jurisdiction_id, input);
      const result: ItemResult<JurisdictionAsset> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Put(':_id')
   @Permission(AppPermissions.Admin.JurisdictionAsset.Write)
   async update(@Param('jurisdiction_id') jurisdiction_id: string, @Param('_id') _id: string, @Body(Sanitize.for(JurisdictionAsset)) input: JurisdictionAsset): Promise<ItemResult<JurisdictionAsset>> {
      const existing = await this.manager.getById(jurisdiction_id, _id);
      if (!existing) {
         throw new NotFoundException();
      }
      existing.fillFromPartial(input);
      const data = await this.manager.replace(jurisdiction_id, _id, existing);
      const result: ItemResult<JurisdictionAsset> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Delete(':_id')
   @Permission(AppPermissions.Admin.JurisdictionAsset.Write)
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

   
}