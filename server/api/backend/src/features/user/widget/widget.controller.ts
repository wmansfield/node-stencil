import { Body, Controller, ForbiddenException, HttpCode, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { cloneDeep } from 'lodash';
import { AuthGuard } from 'src/shared/access-control/auth.guard';
import { RateLimit } from 'src/shared/access-control/rate-limit.decorator';
import { RateLimitGuard } from 'src/shared/access-control/rate-limit.guard';
import { EntityRegistry } from 'src/entities/entity.registry';
import { Widget } from 'src/entities/widget/widget.model';
import { ItemResult } from 'src/shared/types/data/item-result';
import { StencilRequest } from 'src/shared/types/auth.types';
import { Sanitize } from 'src/shared/utils/sanitized';
import { isNullOrWhiteSpace } from 'src/shared/utils';
import { IWidgetReadRequest, WidgetReadRequest } from './models/widgetreadrequest';
import { WidgetUtils } from './widget.utils';

@Controller('v1/widgets')
export class WidgetsController {
   constructor(private readonly entities: EntityRegistry) {}

   @RateLimit({ points: 60, duration: 60 })
   @UseGuards(AuthGuard, RateLimitGuard)
   @Post('get')
   @HttpCode(200)
   async get(
      @Req() request: StencilRequest,
      @Body(Sanitize.for(WidgetReadRequest)) input: IWidgetReadRequest,
   ): Promise<ItemResult<Widget.Public>> {
      if (!request.account) {
         throw new ForbiddenException();
      }
      const jurisdiction_id = request.account.jurisdiction_id;
      const stored = await this.entities.widgetManager.getById(jurisdiction_id, input.widget_id);
      if (!stored) {
         throw new NotFoundException();
      }
      const widget = cloneDeep(stored);
      if (input.language_code && !isNullOrWhiteSpace(input.language_code)) {
         WidgetUtils.prepareForLanguage(widget, input.language_code);
      }
      const result: ItemResult<Widget.Public> = {
         success: true,
         item: widget.toPublic(),
      };
      return result;
   }
}
