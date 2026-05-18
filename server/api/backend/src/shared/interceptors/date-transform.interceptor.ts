import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { transformDates } from 'src/shared/utils/date-transform';

/**
 * Interceptor that automatically converts date strings to Date objects in request bodies.
 * This handles the case where JSON deserialization returns date strings instead of Date objects.
 */
@Injectable()
export class DateTransformInterceptor implements NestInterceptor {
   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();

      if (request.body) {
         request.body = transformDates(request.body);
      }

      return next.handle();
   }
}
