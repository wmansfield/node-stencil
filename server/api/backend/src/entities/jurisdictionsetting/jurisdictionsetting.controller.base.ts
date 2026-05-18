import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { JurisdictionSetting } from './jurisdictionsetting.model';
import { JurisdictionSettingManager } from './jurisdictionsetting.manager';
import { ListResult } from 'src/shared/types/data/list-result';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ActionResult } from 'src/shared/types/data/action-result';
import { AuthGuard, Permission } from 'src/shared/access-control/auth.guard';
import { AppPermissions } from 'src/shared/constants/permissions';
import { OptionalIntPipe, Sanitize } from 'src/shared/utils';
import { OptionalBoolPipe } from 'src/shared/utils/optional-bool.pipe';
import './jurisdictionsetting.sanitized.validators';


@Controller('admin/:jurisdiction_id/jurisdictionsetting')
@UseGuards(AuthGuard)
export class JurisdictionSettingControllerBase {
   constructor(protected readonly manager: JurisdictionSettingManager, ) {}

   @Get('find')
   @Permission(AppPermissions.Admin.JurisdictionSetting.Read)
   async find(
      @Param('jurisdiction_id') jurisdiction_id: string,
      @Query('skip', OptionalIntPipe) skip: number = 0,
      @Query('take', OptionalIntPipe) take: number = 10,
      @Query('order_by') order_by?: string,
      @Query('descending', OptionalBoolPipe) descending: boolean = false,
      @Query('keyword') keyword?: string,
      @Query('name') name?: string
   ): Promise<ListResult<JurisdictionSetting>> {
      const result:ListResult<JurisdictionSetting> = await this.manager.find(jurisdiction_id, skip, take, keyword, order_by, descending, name);
      
      return result;
   }

   @Get(':_id')
   @Permission(AppPermissions.Admin.JurisdictionSetting.Read)
   async get(@Param('jurisdiction_id') jurisdiction_id: string, @Param('_id') _id: string): Promise<ItemResult<JurisdictionSetting>> {
      const data = await this.manager.getById(jurisdiction_id, _id);
      const result: ItemResult<JurisdictionSetting> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Post()
   @Permission(AppPermissions.Admin.JurisdictionSetting.Write)
   async create(@Param('jurisdiction_id') jurisdiction_id: string, @Body(Sanitize.for(JurisdictionSetting)) input: JurisdictionSetting): Promise<ItemResult<JurisdictionSetting>> {
      const data = await this.manager.insert(jurisdiction_id, input);
      const result: ItemResult<JurisdictionSetting> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Put(':_id')
   @Permission(AppPermissions.Admin.JurisdictionSetting.Write)
   async update(@Param('jurisdiction_id') jurisdiction_id: string, @Param('_id') _id: string, @Body(Sanitize.for(JurisdictionSetting)) input: JurisdictionSetting): Promise<ItemResult<JurisdictionSetting>> {
      const existing = await this.manager.getById(jurisdiction_id, _id);
      if (!existing) {
         throw new NotFoundException();
      }
      existing.fillFromPartial(input);
      const data = await this.manager.replace(jurisdiction_id, _id, existing);
      const result: ItemResult<JurisdictionSetting> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Delete(':_id')
   @Permission(AppPermissions.Admin.JurisdictionSetting.Write)
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