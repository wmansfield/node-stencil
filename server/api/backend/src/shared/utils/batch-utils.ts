import { QueryFilter } from 'mongoose';

export class BatchUtils {
   /**
    * Batches entity IDs into chunks and calls a retrieval function for each batch.
    * This is useful for avoiding MongoDB query size limits and improving performance.
    *
    * @param entityIds - Array of entity IDs to retrieve
    * @param getWithinCallback - Function that retrieves multiple entities given an array of IDs
    * @param pageSize - Size of each batch (default: 50)
    * @returns Promise resolving to an array of all retrieved entities
    */
   static async getWithinBuffered<T>(entityIds: string[], getWithinCallback: (ids: string[]) => Promise<T[]>, pageSize: number = 50): Promise<T[]> {
      if (!entityIds || entityIds.length === 0) {
         return [];
      }

      const result: T[] = [];
      const maxPasses = Math.ceil(entityIds.length / pageSize);

      for (let currentPass = 0; currentPass < maxPasses; currentPass++) {
         const skip = currentPass * pageSize;
         const currentEntityIds = entityIds.slice(skip, skip + pageSize);

         if (!currentEntityIds || currentEntityIds.length === 0) {
            break;
         }

         const data = await getWithinCallback(currentEntityIds);
         result.push(...data);
      }

      return result;
   }

   /**
    * Creates a MongoDB filter that uses OR conditions instead of $in operator.
    * This avoids MongoDB collection operator issues by expanding the contains check
    * into explicit equality checks combined with OR.
    *
    * @param valueList - Array of values to match against
    * @param fieldName - Name of the field to match
    * @returns QueryFilter with $or conditions for each value
    */
   static createOrFilter<T>(valueList: (string | null | undefined)[], fieldName: keyof T): QueryFilter<T> {
      if (!valueList || valueList.length === 0) {
         return {} as QueryFilter<T>;
      }

      // Filter out undefined values and create OR conditions
      const orConditions = valueList
         .filter(value => value !== undefined)
         .map(
            value =>
               ({
                  [fieldName]: value === null ? null : value,
               }) as QueryFilter<T>
         );

      if (orConditions.length === 0) {
         return {} as QueryFilter<T>;
      }

      if (orConditions.length === 1) {
         return orConditions[0];
      }

      return {
         $or: orConditions,
      } as QueryFilter<T>;
   }
}
