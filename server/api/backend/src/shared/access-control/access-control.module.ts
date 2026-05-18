import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import { AppConfigModule } from '../../config/config.module';
import { EntityRegistryModule } from 'src/entities/entity-registry.module';
import { AUTH_PROVIDER } from './auth-provider/auth-provider.interface';
import { FirebaseAuthProvider } from './auth-provider/firebase-auth.provider';
import { LocalAuthProvider } from './auth-provider/local-auth.provider';
import { ConfigResolver } from 'src/config/config.resolver';

@Global()
@Module({
   imports: [AppConfigModule, EntityRegistryModule],
   providers: [
      AuthGuard,
      RateLimitGuard,
      RateLimitService,
      {
         provide: AUTH_PROVIDER,
         useFactory: (configResolver: ConfigResolver) => {
            if (process.env.FIREBASE_PROJECT_ID) {
               return new FirebaseAuthProvider(configResolver);
            }
            console.warn('\n⚠️  FIREBASE_PROJECT_ID is not set — using LocalAuthProvider (development mode).\n   POST /api/v1/auth/dev-token to obtain a Bearer token.\n');
            return new LocalAuthProvider();
         },
         inject: [ConfigResolver],
      },
   ],
   exports: [AuthGuard, RateLimitGuard, RateLimitService, AUTH_PROVIDER],
})
export class AccessControlModule {}
