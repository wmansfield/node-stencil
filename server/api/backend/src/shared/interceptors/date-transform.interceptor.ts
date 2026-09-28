import { Injectable, NestInterceptor, ExecutionContext, CallHandler, SetMetadata } from '@nestjs/common';
import { Observable } from 'rxjs';
import { transformDates } from 'src/shared/utils/date-transform';

export const SKIP_DATE_TRANSFORM_KEY = 'skipDateTransform';

/**
 * Leaves the request body exactly as received. For protocol envelopes whose string fields may look
 * like dates (e.g. MCP's protocolVersion "2025-11-25"); the handler converts its own payload.
 */
export const SkipDateTransform = () => SetMetadata(SKIP_DATE_TRANSFORM_KEY, true);

/**
 * Interceptor that automatically converts date strings to Date objects in request bodies.
 * This handles the case where JSON deserialization returns date strings instead of Date objects.
 */
@Injectable()
export class DateTransformInterceptor implements NestInterceptor {
   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const skip = Reflect.getMetadata(SKIP_DATE_TRANSFORM_KEY, context.getHandler()) ?? Reflect.getMetadata(SKIP_DATE_TRANSFORM_KEY, context.getClass());

      if (request.body && !skip) {
         request.body = transformDates(request.body);
      }

      return next.handle();
   }
}
