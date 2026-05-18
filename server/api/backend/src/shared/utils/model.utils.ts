import { ListResult } from '../types/data/list-result';
import { PagingInfo } from '../types/data/paging-info';

export default class ModelUtils {
   static toSteppedList<T>(items: T[], skip: number, take: number, total: number): ListResult<T> {
      const result: ListResult<T> = {
         success: true,
         items: [], // assigned below
         stepping: {
            total: total,
            more: false, // assigned below
            skip: 0, // assigned below
            current: skip,
         },
      };
      result.items = [...items];

      if (result.items.length > take) {
         result.stepping!.more = true;
         const extra = result.items.length - take;
         for (let i = 0; i < extra; i++) {
            result.items.pop();
         }
      }

      result.stepping!.skip = skip + result.items.length;
      result.paging = new PagingInfo(skip, take, total);

      return result;
   }
}
