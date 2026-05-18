import { Global, Module, forwardRef } from '@nestjs/common';
import { ConfigResolver } from './config.resolver';

@Global()
@Module({
   providers: [ConfigResolver],
   exports: [ConfigResolver],
})
export class AppConfigModule {}
