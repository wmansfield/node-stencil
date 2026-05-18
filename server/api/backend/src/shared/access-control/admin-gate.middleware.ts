import { Injectable, NestMiddleware, ForbiddenException, Logger, OnModuleInit } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigResolver } from 'src/config/config.resolver';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Middleware that gates all /admin/* routes behind a shared secret header.
 *
 * Requests to admin endpoints must include:
 *   X-Admin-Token: <value matching ADMIN_GATE_TOKEN env var>
 *
 * This is a defense-in-depth layer on top of:
 *   1. Cloudflare Access (identity-aware proxy on admin.your-domain.com)
 *   2. Cloudflare WAF rule (blocks /api/admin/* without the header at the edge)
 *   3. Firebase JWT + Permission decorators (inner auth layer)
 *
 * In production, ADMIN_GATE_TOKEN is required — the middleware will reject all
 * admin requests if it is not configured. In development, the gate is bypassed
 * when the token is absent for local convenience.
 *
 * Note: uses req.originalUrl (not req.path) because NestJS mounts middleware
 * at specific route paths, making req.path always "/" inside the handler.
 */
@Injectable()
export class AdminGateMiddleware implements NestMiddleware, OnModuleInit {
   private readonly logger = new Logger(AdminGateMiddleware.name);
   private token: string | undefined;

   constructor(private readonly configResolver: ConfigResolver) {}

   async onModuleInit() {
      this.token = await this.configResolver.getValue('ADMIN_GATE_TOKEN');
      if (this.token) {
         this.logger.log('Admin gate enabled — /admin/* routes require X-Admin-Token header');
      } else if (isDev) {
         this.logger.warn('ADMIN_GATE_TOKEN not set — admin gate is disabled (dev mode, all admin requests allowed)');
      } else {
         this.logger.error('ADMIN_GATE_TOKEN not set in production — all admin requests will be rejected');
      }
   }

   use(req: Request, res: Response, next: NextFunction) {
      if (!req.originalUrl.startsWith('/api/admin')) {
         return next();
      }

      if (req.method === 'OPTIONS') {
         return next();
      }

      if (!this.token) {
         if (isDev) {
            return next();
         }
         this.logger.warn(`Admin gate rejected request to ${req.originalUrl} (ADMIN_GATE_TOKEN not configured)`);
         return next(new ForbiddenException('Access denied'));
      }

      const headerValue = req.headers['x-admin-token'] as string | undefined;
      if (!headerValue || headerValue !== this.token) {
         this.logger.warn(`Admin gate rejected request to ${req.originalUrl} (missing or invalid X-Admin-Token)`);
         return next(new ForbiddenException('Access denied'));
      }

      next();
   }
}
