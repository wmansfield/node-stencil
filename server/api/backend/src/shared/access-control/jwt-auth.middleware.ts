import { Injectable, NestMiddleware, UnauthorizedException, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StencilRequest, StencilAuthResult } from 'src/shared/types/auth.types';
import { AUTH_PROVIDER, IAuthProvider } from './auth-provider/auth-provider.interface';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
   constructor(@Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider) {}

   async use(req: Request, res: Response, next: NextFunction) {
      if (req.method === 'OPTIONS') {
         return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return next(new UnauthorizedException('Missing or invalid authorization header'));
      }

      const token = authHeader.split('Bearer ')[1];
      if (!token) {
         return next(new UnauthorizedException('Missing token'));
      }

      try {
         const payload = await this.authProvider.verifyToken(token);
         (req as StencilRequest).auth = { payload, token } as StencilAuthResult;
         next();
      } catch (error) {
         next(error instanceof UnauthorizedException ? error : new UnauthorizedException('Invalid or expired token'));
      }
   }
}
