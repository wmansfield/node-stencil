import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StencilRequest, StencilAuthResult, StencilJWTPayload } from 'src/shared/types/auth.types';

/**
 * Test replacement for JwtAuthMiddleware.
 *
 * Instead of verifying a Firebase ID token, this middleware injects a
 * synthetic auth payload derived from a well-known test header:
 *
 *   x-test-sub: <firebase-uid-equivalent>
 *
 * The real AuthGuard still runs after this middleware, so GlobalAccount
 * and Account resolution are fully exercised against the test database.
 */
@Injectable()
export class TestJwtMiddleware implements NestMiddleware {
   use(req: Request, _res: Response, next: NextFunction) {
      if (req.method === 'OPTIONS') {
         return next();
      }

      const sub = req.headers['x-test-sub'] as string | undefined;
      if (!sub) {
         return next(); // let the AuthGuard reject unauthenticated requests
      }

      const payload: StencilJWTPayload = {
         sub,
         email: `${sub}@test.stencil.local`,
         email_verified: true,
         name: 'Test User',
         jurisdiction_id: req.headers['x-jurisdiction'] as string | undefined,
      };

      (req as StencilRequest).auth = {
         payload,
         token: 'test-token',
      } as StencilAuthResult;

      next();
   }
}
