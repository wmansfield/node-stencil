import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Histogram } from 'prom-client';
import { StencilRequest } from 'src/shared/types/auth.types';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
   private readonly duration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of inbound HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'jurisdiction'] as const,
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
   });

   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest<StencilRequest>();
      if (!request.path?.includes('/v1/')) {
         return next.handle();
      }

      const start = process.hrtime.bigint();
      const response = context.switchToHttp().getResponse();

      return next.handle().pipe(
         tap({
            next: () => this.record(request, response.statusCode, start),
            error: (err) => this.record(request, err.status ?? err.getStatus?.() ?? 500, start),
         }),
      );
   }

   private record(request: StencilRequest, statusCode: number, start: bigint): void {
      const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
      const route = (request.route?.path as string) ?? request.path;

      this.duration.observe(
         {
            method: request.method,
            route,
            status_code: String(statusCode),
            jurisdiction: request.jurisdiction_id ?? 'unknown',
         },
         durationSec,
      );
   }
}
