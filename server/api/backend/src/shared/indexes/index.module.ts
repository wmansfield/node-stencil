import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndexManager } from './index.builder';

@Module({
   imports: [MongooseModule],
   providers: [IndexManager],
   exports: [IndexManager],
})
export class IndexModule {}
