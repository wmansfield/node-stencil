import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MongoModule } from 'src/shared/mongo/mongo.module';

@Module({
   imports: [MongoModule],
   controllers: [HealthController],
})
export class HealthModule {}
