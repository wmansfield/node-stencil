import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { FriendlyExceptionFilter } from './shared/exceptions/friendly-exception.filter';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { DateTransformInterceptor } from './shared/interceptors/date-transform.interceptor';

async function bootstrap() {
   const isProduction = process.env.NODE_ENV === 'production';

   if (isProduction) {
      process.env.NO_COLOR = '1';
   }

   const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: isProduction
         ? new ConsoleLogger({ logLevels: ['log', 'warn', 'error', 'fatal'], colors: false })
         : undefined,
   });

   // Disable ETag generation - we handle caching via API-controlled logic (MemoryCache), not HTTP-level ETags
   app.set('etag', false);

   app.use(helmet({
      contentSecurityPolicy: {
         directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com"],
            frameSrc: ["'self'", "https://*.firebaseapp.com"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
         },
      },
   }));

   // Middleware to copy X-Content-Encoding to Content-Encoding
   // This handles cases where React Native strips the standard header but preserves X-Content-Encoding
   app.use((req: Request, res: Response, next: NextFunction) => {
      const xContentEncoding = req.headers['x-content-encoding'];
      if (xContentEncoding && !req.headers['content-encoding']) {
         req.headers['content-encoding'] = Array.isArray(xContentEncoding) ? xContentEncoding[0] : xContentEncoding;
      }
      next();
   });

   // Note: NestJS uses Express's body parser by default, which automatically handles
   // gzip/deflate decompression of request bodies (inflate: true is the default)

   app.setGlobalPrefix('api');

   // In production, serve static files from the frontend build
   if (isProduction) {
      app.useStaticAssets(join(__dirname, '..', '..', 'frontend', 'build'));
      // Serve index.html for all routes except /api
      app.use((req: Request, res: Response, next: NextFunction) => {
         if (!req.path.startsWith('/api')) {
            res.sendFile(join(__dirname, '..', '..', 'frontend', 'build', 'index.html'));
         } else {
            next();
         }
      });
   }

   // Enable CORS - always needed when frontend and backend are on different origins
   const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : isProduction
         ? ['http://localhost:3000', 'http://frontend:3000']
         : true;

   // Register exception filter FIRST, before other middleware
   app.useGlobalFilters(new FriendlyExceptionFilter());

   app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Content-Encoding', 'X-Content-Encoding', 'Authorization', 'X-Admin-Token'],
   });

   // Register global interceptor to automatically convert date strings to Date objects
   app.useGlobalInterceptors(new DateTransformInterceptor());

   // Add global validation pipe to automatically convert query parameters
   app.useGlobalPipes(
      new ValidationPipe({
         transform: true,
         transformOptions: {
            enableImplicitConversion: true,
         },
      })
   );

   await app.listen(process.env.PORT || 3001);
}
bootstrap();
