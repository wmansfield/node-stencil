import { Injectable } from '@nestjs/common';

@Injectable()
export class DependencyCoordinator {
   constructor() {}

   markInvalidated(entityType: string, entity: any) {
      //TODO:MUST: CASCADE INVALIDATIONS
      // iInvalidateForeignKey:single
      // foreignKeyInvalidatesMe:single
      // dependency:multple
   }
}
