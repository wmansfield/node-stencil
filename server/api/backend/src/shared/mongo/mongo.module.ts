import { Module } from '@nestjs/common';
import { MongoConnectionProvider } from './mongo-connection.provider';
import { DevMongoConnectionProvider } from './dev-mongo-connection.provider';
import { AppConfigModule } from 'src/config/config.module';
import { ConfigResolver } from 'src/config/config.resolver';

/**
 * Provides `MongoConnectionProvider` to the rest of the app.
 *
 * When `MONGO_URI` is not set (local development), the module substitutes
 * `DevMongoConnectionProvider`, which spins up an in-memory MongoDB instance
 * automatically. No additional configuration is required.
 *
 * When `MONGO_URI` is set (staging / production), the real provider is used,
 * which connects to Atlas and handles queryable encryption via KMS.
 */
@Module({
   imports: [AppConfigModule],
   providers: [
      {
         provide: MongoConnectionProvider,
         useFactory: (configResolver: ConfigResolver) => {
            if (!process.env.MONGO_URI) {
               console.warn('\n⚠️  MONGO_URI is not set — using in-memory MongoDB (development mode).\n   Data will not persist between restarts.\n   Set MONGO_URI to connect to a real database.\n');
               return new DevMongoConnectionProvider();
            }
            return new MongoConnectionProvider(configResolver);
         },
         inject: [ConfigResolver],
      },
   ],
   exports: [MongoConnectionProvider],
})
export class MongoModule {}
