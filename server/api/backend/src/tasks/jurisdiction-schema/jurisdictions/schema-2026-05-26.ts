import { Logger } from '@nestjs/common';
import { EntityRegistry } from 'src/entities/entity.registry';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';

export async function upgradeTo_v2026_05_26(
   logger: Logger,
   entities: EntityRegistry,
   connectionProvider: MongoConnectionProvider,
   jurisdiction_id: string,
): Promise<void> {
   logger.log(`[v2026_05_26] Starting Fake Upgrade Started: ${jurisdiction_id}`);

   // this is where you perform jurisdiction specific migrations
   // use anything in entities or connectionprovider as needed.
   
   logger.log(`[v2026_05_26] Starting Fake Upgrade Completed: ${jurisdiction_id}`);

}
