import { MiddlewareConsumer, Module, NestModule, OnApplicationShutdown } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongoModule } from './shared/mongo/mongo.module';
import { MongoConnectionProvider } from './shared/mongo/mongo-connection.provider';
import { TasksModule } from './tasks/tasks.module';
import { AppConfigModule } from './config/config.module';
import { EntitiesModule } from './entities/entity.module';
import { EntityRegistryModule } from './entities/entity-registry.module';
import { DependencyModule } from './entities/dependencies/dependency.module';
import { HealthModule } from './features/platform/health/health.module';
import { CacheModule } from './shared/cache/cache.module';
import { JwtAuthMiddleware } from './shared/access-control/jwt-auth.middleware';
import { AccessControlModule } from './shared/access-control/access-control.module';
import { StorageModule } from './features/platform/storage/storage.module';
import { JurisdictionMiddleware } from './shared/access-control/jurisdiction.middleware';
import { AdminGateMiddleware } from './shared/access-control/admin-gate.middleware';
import { RateLimitGuard } from './shared/access-control/rate-limit.guard';
import { UserModule } from './features/user/user.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { JurisdictionMismatchInterceptor } from './shared/interceptors/jurisdiction-mismatch.interceptor';
import { HttpMetricsInterceptor } from './shared/interceptors/http-metrics.interceptor';
import { BootstrapModule } from './features/platform/bootstrap/bootstrap.module';

@Module({
   imports: [
      ConfigModule.forRoot({
         isGlobal: true,
      }),
      PrometheusModule.register({
         path: '/metrics',
         defaultMetrics: { enabled: true },
      }),
      AppConfigModule,
      TasksModule.forRoot(),
      EntityRegistryModule,
      DependencyModule,
      EntitiesModule.forRoot(),
      AccessControlModule,
      MongoModule,
      HealthModule,
      StorageModule,
      CacheModule,
      UserModule,
      BootstrapModule
   ],
   providers: [
      AppConfigModule,
      { provide: APP_GUARD, useClass: RateLimitGuard },
      { provide: APP_INTERCEPTOR, useClass: JurisdictionMismatchInterceptor },
      { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
   ],
   exports: [],
})
export class AppModule implements OnApplicationShutdown, NestModule {
   constructor(private readonly connectionProvider: MongoConnectionProvider) {}

   async onApplicationShutdown(): Promise<void> {
      await this.connectionProvider.closeConnections();
   }

   configure(consumer: MiddlewareConsumer) {
      consumer
         .apply(AdminGateMiddleware)
         .forRoutes('{*splat}');

      consumer
         .apply(JurisdictionMiddleware, JwtAuthMiddleware)
         .exclude(
            'platform/bootstrap',
            'platform/health',
            'health',
            'metrics',
            'v1/auth/dev-token',
         )
         .forRoutes('{*splat}');
   }
}
