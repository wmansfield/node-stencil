import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Core modules
import { AppConfigModule } from 'src/config/config.module';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { EntityRegistryModule } from 'src/entities/entity-registry.module';
import { DependencyModule } from 'src/entities/dependencies/dependency.module';
import { EntitiesModule } from 'src/entities/entity.module';
import { AccessControlModule } from 'src/shared/access-control/access-control.module';
import { CacheModule } from 'src/shared/cache/cache.module';
import { StorageModule } from 'src/features/platform/storage/storage.module';
import { UserModule } from 'src/features/user/user.module';
import { EmailModule } from 'src/shared/email/email.module';

// Middleware
import { JurisdictionMiddleware } from 'src/shared/access-control/jurisdiction.middleware';
import { JwtAuthMiddleware } from 'src/shared/access-control/jwt-auth.middleware';

// Storage providers (for mocking)
import { CloudStorageHandler } from 'src/features/platform/storage/handlers/cloud-storage.handler';
import { ImageResizeService } from 'src/features/platform/storage/services/image-resize.service';

// Test overrides
import { TestJwtMiddleware } from './test-jwt.middleware';
import { TestMongoConnectionProvider } from './test-mongo-connection.provider';
import { DateTransformInterceptor } from 'src/shared/interceptors/date-transform.interceptor';

// ---------------------------------------------------------------------------
// Mock CloudStorageHandler — uses distinct URL prefixes so tests can assert
// whether a response contains a public (unsigned) or signed URL.
// ---------------------------------------------------------------------------
const mockCloudStorageHandler = {
   getStorageConfigCached: jest.fn().mockResolvedValue({
      tenantCode: 'TEST',
      maxFileSize: 10_485_760,
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/wav'],
      allowedFileExtensions: ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.m4a', '.mp3', '.wav'],
      storageProvider: 'azure',
   }),
   generateUploadSignature: jest.fn().mockResolvedValue({
      url: 'https://mock-upload.example.com/signed-upload-url',
   }),
   generatePostUploadSignature: jest.fn().mockResolvedValue({
      url: 'https://mock-upload.example.com/signed-post-url',
      fields: { key: 'test-key', 'Content-Type': 'application/octet-stream', Policy: 'mock-policy', 'X-Amz-Signature': 'mock-sig' },
      expiresInMinutes: 60,
   }),
   getFileMetadata: jest.fn().mockResolvedValue({ size: 102_400 }),
   getPublicUrl: jest.fn().mockImplementation((tenant: string, key: string) => Promise.resolve(`https://mock-public/${tenant}/${key}`)),
   generateFileAccessSignatureBucket: jest
      .fn()
      .mockImplementation((tenant: string, key: string) => Promise.resolve(`https://mock-signed/${tenant}/${key}?sig=bucket`)),
   generateFileAccessSignatureSingle: jest.fn().mockResolvedValue({
      url: 'https://mock-signed-single/file?sig=single',
      expiresInMinutes: 15,
   }),
   makeFilePublic: jest.fn().mockResolvedValue(true),
};

// ---------------------------------------------------------------------------
// Mock ImageResizeService — returns deterministic thumb keys.
// ---------------------------------------------------------------------------
const mockImageResizeService = {
   processStoredImage: jest.fn().mockImplementation((_tenant: string, sourceKey: string) =>
      Promise.resolve({
         success: true,
         thumbSmallKey: `thumb-sm-${sourceKey}`,
         thumbLargeKey: `thumb-lg-${sourceKey}`,
      })
   ),
};

/**
 * Slimmed-down app module for integration tests.
 *
 * Same structure as AppModule but:
 *  - Uses TestJwtMiddleware instead of JwtAuthMiddleware (no Firebase)
 *  - Omits TasksModule (no scheduled background jobs)
 *  - Omits BootstrapModule / HealthModule (not under test)
 */
@Module({
   imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      AppConfigModule,
      EntityRegistryModule,
      DependencyModule,
      EntitiesModule.forRoot(),
      AccessControlModule,
      MongoModule,
      CacheModule,
      StorageModule,
      EmailModule,
      UserModule,
   ],
})
class TestAppModule implements NestModule {
   configure(consumer: MiddlewareConsumer) {
      consumer.apply(JurisdictionMiddleware, TestJwtMiddleware).forRoutes('*');
   }
}

export interface TestContext {
   app: NestExpressApplication;
   mongoServer: MongoMemoryServer;
   mongoProvider: TestMongoConnectionProvider;
}

/**
 * Boots a fully-wired NestJS app backed by an in-memory MongoDB.
 *
 * Usage:
 *   const ctx = await createTestApp();
 *   // … run tests with supertest against ctx.app …
 *   await teardownTestApp(ctx);
 */
export async function createTestApp(): Promise<TestContext> {
   const existing = process.env.FEDERATION_JURISDICTION ?? '';
   if (!existing.toUpperCase().split(',').includes('TE')) {
      process.env.FEDERATION_JURISDICTION = existing ? `${existing},TE` : 'TE,SHARED';
   }

   // 1. Start in-memory MongoDB
   const mongoServer = await MongoMemoryServer.create();
   const mongoUri = mongoServer.getUri();

   // 2. Create the test Mongo provider and give it the URI
   const mongoProvider = new TestMongoConnectionProvider();
   mongoProvider.setUri(mongoUri);

   // 3. Build NestJS testing module, replacing MongoConnectionProvider
   const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
   })
      .overrideProvider(MongoConnectionProvider)
      .useValue(mongoProvider)
      .overrideProvider(JwtAuthMiddleware)
      .useClass(TestJwtMiddleware)
      .overrideProvider(CloudStorageHandler)
      .useValue(mockCloudStorageHandler)
      .overrideProvider(ImageResizeService)
      .useValue(mockImageResizeService)
      .compile();

   // 4. Create Express app with the same settings as production main.ts
   const app = moduleRef.createNestApplication<NestExpressApplication>();
   app.setGlobalPrefix('api');

   app.useGlobalInterceptors(new DateTransformInterceptor());

   app.useGlobalPipes(
      new ValidationPipe({
         whitelist: false,
         forbidNonWhitelisted: false,
         transform: true,
         transformOptions: {
            enableImplicitConversion: true,
         },
      })
   );

   await app.init();

   return { app, mongoServer, mongoProvider };
}

/**
 * Cleanly shuts down the test app and in-memory MongoDB.
 */
export async function teardownTestApp(ctx: TestContext): Promise<void> {
   await ctx.mongoProvider.closeConnections();
   await ctx.app.close();
   await ctx.mongoServer.stop();
}
