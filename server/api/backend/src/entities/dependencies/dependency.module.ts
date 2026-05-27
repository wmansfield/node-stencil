import { Global, Module } from '@nestjs/common';
import { DependencyCoordinator } from './dependency-coordinator';

@Global()
@Module({
   providers: [DependencyCoordinator],
   exports: [DependencyCoordinator],
})
export class DependencyModule {}
