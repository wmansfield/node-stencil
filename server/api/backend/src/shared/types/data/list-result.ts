import { PagingInfo } from './paging-info';
import { SteppingInfo } from './stepping-info';

export type ListResult<T> = {
   success: boolean;
   items: T[];
   stepping?: SteppingInfo;
   paging?: PagingInfo;
};
