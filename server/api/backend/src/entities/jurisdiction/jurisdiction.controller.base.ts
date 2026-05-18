import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { Jurisdiction } from './jurisdiction.model';
import { JurisdictionManager } from './jurisdiction.manager';
import { ListResult } from 'src/shared/types/data/list-result';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ActionResult } from 'src/shared/types/data/action-result';
import { AuthGuard, Permission } from 'src/shared/access-control/auth.guard';
import { AppPermissions } from 'src/shared/constants/permissions';
import { OptionalIntPipe, Sanitize } from 'src/shared/utils';
import { OptionalBoolPipe } from 'src/shared/utils/optional-bool.pipe';
import './jurisdiction.sanitized.validators';


@Controller('admin/jurisdiction')
@UseGuards(AuthGuard)
export class JurisdictionControllerBase {
   constructor(protected readonly manager: JurisdictionManager, ) {}

   @Get('find')
   @Permission(AppPermissions.Admin.Jurisdiction.Read)
   async find(
      @Query('skip', OptionalIntPipe) skip: number = 0,
      @Query('take', OptionalIntPipe) take: number = 10,
      @Query('order_by') order_by?: string,
      @Query('descending', OptionalBoolPipe) descending: boolean = false,
      @Query('keyword') keyword?: string,
      @Query('jurisdiction_id') jurisdiction_id?: string
   ): Promise<ListResult<Jurisdiction>> {
      const result:ListResult<Jurisdiction> = await this.manager.find(skip, take, keyword, order_by, descending, jurisdiction_id);
      
      return result;
   }

   @Get(':_id')
   @Permission(AppPermissions.Admin.Jurisdiction.Read)
   async get(@Param('_id') _id: string): Promise<ItemResult<Jurisdiction>> {
      const data = await this.manager.getById(_id);
      const result: ItemResult<Jurisdiction> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Post()
   @Permission(AppPermissions.Admin.Jurisdiction.Write)
   async create(@Body(Sanitize.for(Jurisdiction)) input: Jurisdiction): Promise<ItemResult<Jurisdiction>> {
      const data = await this.manager.insert(input);
      const result: ItemResult<Jurisdiction> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Put(':_id')
   @Permission(AppPermissions.Admin.Jurisdiction.Write)
   async update(@Param('_id') _id: string, @Body(Sanitize.for(Jurisdiction)) input: Jurisdiction): Promise<ItemResult<Jurisdiction>> {
      const existing = await this.manager.getById(_id);
      if (!existing) {
         throw new NotFoundException();
      }
      existing.fillFromPartial(input);
      const data = await this.manager.replace(_id, existing);
      const result: ItemResult<Jurisdiction> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Delete(':_id')
   @Permission(AppPermissions.Admin.Jurisdiction.Write)
   async delete(@Param('_id') _id: string): Promise<ActionResult> {
      const data = await this.manager.getById(_id);
      if (data){
         await this.manager.delete(data);
      }
      const result: ActionResult = {
         success: true
      };
      return result;
   }

   
}