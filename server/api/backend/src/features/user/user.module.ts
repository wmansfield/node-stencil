import { Module } from '@nestjs/common';
import { EntitiesModule } from 'src/entities/entity.module';
import { AppConfigModule } from 'src/config/config.module';
import { StorageModule } from '../platform/storage';
import { AuthController } from './auth/auth.controller';
import { MediaController } from './media/media.controller';
import { ProfileController } from './profile/profile.controller';

@Module({
   imports: [AppConfigModule, EntitiesModule, StorageModule],
   controllers: [
      AuthController,
      MediaController,
      ProfileController,
   ],
})
export class UserModule {}
