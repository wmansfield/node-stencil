import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IndexManager, IndexDefinition } from '../shared/indexes/index.builder';

interface EntityIndexes {
   collectionName: string;
   indexes: IndexDefinition[];
}

const entityIndexes: EntityIndexes[] = [
   {
      collectionName: 'plans',
      indexes: [
         {
            name: 'id_unique',
            fields: { id: 1 },
            options: { unique: true },
         },
         {
            name: 'name_unique',
            fields: { name: 1 },
            options: { unique: true },
         },
      ],
   },
   // Add more entities here as needed
];

async function ensureIndexes(indexManager: IndexManager, entity: EntityIndexes): Promise<void> {
   console.log(`\nChecking indexes for ${entity.collectionName}...`);

   const existingIndexes = await indexManager.getIndexes(entity.collectionName);
   console.log(
      'Current indexes:',
      existingIndexes.map(idx => idx.name)
   );

   for (const indexDef of entity.indexes) {
      const indexExists = existingIndexes.some(index => index.name === indexDef.name);

      if (!indexExists) {
         console.log(`Creating index ${indexDef.name}...`);
         await indexManager.createIndex(entity.collectionName, indexDef);
         console.log('Index created successfully');
      } else {
         console.log(`Index ${indexDef.name} already exists`);
      }
   }
}

async function bootstrap() {
   const app = await NestFactory.createApplicationContext(AppModule);
   const indexManager = app.get(IndexManager);

   try {
      for (const entity of entityIndexes) {
         await ensureIndexes(indexManager, entity);
      }
   } catch (err) {
      console.error('Error managing indexes:', err);
      process.exit(1);
   } finally {
      await app.close();
   }
}

bootstrap().catch(err => {
   console.error('Error:', err);
   process.exit(1);
});
