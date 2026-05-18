import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Placeholder interceptor — jurisdiction mismatch tracking was part of the
 * federation feature which has been removed. This file remains registered in
 * AppModule; replace or remove it when you no longer need the hook point.
 */
@Injectable()
export class JurisdictionMismatchInterceptor implements NestInterceptor {
   intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle();
   }
}
