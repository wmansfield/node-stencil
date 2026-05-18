import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { Timezone } from './timezone.model';
import { TimezoneManager } from './timezone.manager';
import { ListResult } from 'src/shared/types/data/list-result';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ActionResult } from 'src/shared/types/data/action-result';
import { AuthGuard, Permission } from 'src/shared/access-control/auth.guard';
import { AppPermissions } from 'src/shared/constants/permissions';
import { OptionalIntPipe, Sanitize } from 'src/shared/utils';
import { OptionalBoolPipe } from 'src/shared/utils/optional-bool.pipe';
import './timezone.sanitized.validators';


@Controller('admin/timezone')
@UseGuards(AuthGuard)
export class TimezoneControllerBase {
   constructor(protected readonly manager: TimezoneManager, ) {}

   @Get('find')
   @Permission(AppPermissions.Admin.Timezone.Read)
   async find(
      @Query('skip', OptionalIntPipe) skip: number = 0,
      @Query('take', OptionalIntPipe) take: number = 10,
      @Query('order_by') order_by?: string,
      @Query('descending', OptionalBoolPipe) descending: boolean = false,
      @Query('keyword') keyword?: string,
      @Query('iana_zone') iana_zone?: string,
      @Query('tag') tag?: string
   ): Promise<ListResult<Timezone>> {
      const result:ListResult<Timezone> = await this.manager.find(skip, take, keyword, order_by, descending, iana_zone, tag);
      
      return result;
   }

   @Get(':_id')
   @Permission(AppPermissions.Admin.Timezone.Read)
   async get(@Param('_id') _id: string): Promise<ItemResult<Timezone>> {
      const data = await this.manager.getById(_id);
      const result: ItemResult<Timezone> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Post()
   @Permission(AppPermissions.Admin.Timezone.Write)
   async create(@Body(Sanitize.for(Timezone)) input: Timezone): Promise<ItemResult<Timezone>> {
      const data = await this.manager.insert(input);
      const result: ItemResult<Timezone> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Put(':_id')
   @Permission(AppPermissions.Admin.Timezone.Write)
   async update(@Param('_id') _id: string, @Body(Sanitize.for(Timezone)) input: Timezone): Promise<ItemResult<Timezone>> {
      const existing = await this.manager.getById(_id);
      if (!existing) {
         throw new NotFoundException();
      }
      existing.fillFromPartial(input);
      const data = await this.manager.replace(_id, existing);
      const result: ItemResult<Timezone> = {
         success: true,
         item: data,
      };
      
      return result;
   }

   @Delete(':_id')
   @Permission(AppPermissions.Admin.Timezone.Write)
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