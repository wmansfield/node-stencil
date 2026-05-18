import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';

@Injectable()
export class MongoPrunerService {
   constructor(private readonly mongoConnectionProvider: MongoConnectionProvider) {}

   @Interval(1 * 60 * 1000)
   async handlePruneConnections() {
      await this.mongoConnectionProvider.pruneConnections();
   }
}
