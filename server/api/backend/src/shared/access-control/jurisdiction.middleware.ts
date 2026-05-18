import { Injectable, NestMiddleware, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StencilRequest } from 'src/shared/types/auth.types';

@Injectable()
export class JurisdictionMiddleware implements NestMiddleware, OnModuleInit {
   constructor() {}

   async onModuleInit() {}

   async use(req: Request, res: Response, next: NextFunction) {
      // Skip validation for OPTIONS requests (CORS preflight)
      if (req.method === 'OPTIONS') {
         return next();
      }

      try {
         const headerValue = req.headers['x-jurisdiction'];
         // Extract as string: handle both string and string[] cases
         const jurisdiction_id: string | undefined = Array.isArray(headerValue) ? headerValue[0] : headerValue;

         // Attach to request
         (req as StencilRequest).jurisdiction_id = jurisdiction_id;

         next();
      } catch (error) {
         return next(new UnauthorizedException(`Invalid jurisdiction: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
   }
}
