import { Controller, Get, HttpException, HttpStatus, Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { AuthGuard, Permission } from 'src/shared/access-control/auth.guard';
import { RateLimit } from 'src/shared/access-control/rate-limit.decorator';
import { RateLimitGuard } from 'src/shared/access-control/rate-limit.guard';
import { AppPermissions } from 'src/shared/constants/permissions/app';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { SHARED_TENANT_CODE } from 'src/shared/constants/tenants';
import { Gauge } from 'prom-client';

const BUILD_SHA = process.env.BUILD_SHA || 'dev';

@Controller()
export class HealthController implements OnModuleInit {
   private readonly logger = new Logger(HealthController.name);
   private dbVerified = false;

   private readonly buildInfo = new Gauge({
      name: 'app_build_info',
      help: 'Build metadata (value is always 1, labels carry the info)',
      labelNames: ['sha', 'node_version'] as const,
   });

   constructor(private readonly mongoConnectionProvider: MongoConnectionProvider) {}

   onModuleInit() {
      this.buildInfo.labels(BUILD_SHA, process.version).set(1);
      this.logger.log(`Build SHA: ${BUILD_SHA}`);
   }

   @RateLimit({ points: 120, duration: 60 })
   @UseGuards(RateLimitGuard)
   @Get('health')
   async healthCheck() {
      if (!this.dbVerified) {
         try {
            this.logger.log('Verifying database connection for health check...');
            const connection = await this.mongoConnectionProvider.getTenantConnection(SHARED_TENANT_CODE);
            await connection.db!.admin().ping();
            this.dbVerified = true;
            this.logger.log('Database connection verified successfully');
         } catch (error) {
            this.logger.error('Database connection failed during health check', error);
            throw new HttpException('Database connection not ready', HttpStatus.SERVICE_UNAVAILABLE);
         }
      }

      return { status: 'ok', build: BUILD_SHA };
   }

   @RateLimit({ points: 30, duration: 60 })
   @Permission(AppPermissions.Health.Instance.Read)
   @UseGuards(AuthGuard, RateLimitGuard)
   @Get('platform/health')
   async healthDetailed() {
      return {
         status: 'ok',
         timestamp: new Date().toISOString(),
         uptime: process.uptime(),
         memory: process.memoryUsage(),
         dbVerified: this.dbVerified,
      };
   }
}
