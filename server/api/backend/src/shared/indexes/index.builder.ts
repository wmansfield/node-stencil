import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

export interface IndexDefinition {
   name: string;
   fields: Record<string, number>;
   options?: {
      unique?: boolean;
      sparse?: boolean;
   };
}

@Injectable()
export class IndexManager {
   constructor(
      @InjectModel('Index') private readonly indexModel: Model<any>,
      private readonly configService: ConfigService
   ) {}

   async createIndex(collectionName: string, definition: IndexDefinition): Promise<void> {
      const collection = this.indexModel.db.collection(collectionName);
      const options = {
         ...definition.options,
      };
      await collection.createIndex(definition.fields, options);
   }

   async dropIndex(collectionName: string, indexName: string): Promise<void> {
      const collection = this.indexModel.db.collection(collectionName);
      await collection.dropIndex(indexName);
   }

   async getIndexes(collectionName: string): Promise<any[]> {
      const collection = this.indexModel.db.collection(collectionName);
      return collection.indexes();
   }

   async rebuildIndex(collectionName: string, indexName: string): Promise<void> {
      const collection = this.indexModel.db.collection(collectionName);
      await collection.dropIndex(indexName);
      const indexes = await this.getIndexes(collectionName);
      const index = indexes.find(i => i.name === indexName);
      if (index) {
         await this.createIndex(collectionName, {
            name: indexName,
            fields: index.key,
            options: index.options,
         });
      }
   }
}
