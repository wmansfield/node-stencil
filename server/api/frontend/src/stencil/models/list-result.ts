import { IPagingInfo } from './paging-info';
import { ISteppingInfo } from './stepping-info';

export type ListResult<TItem> = {
   success: boolean;
   message?: string;
   items?: TItem[];
   paging?: IPagingInfo;
   stepping?: ISteppingInfo;
};
export type ListResultMeta<TItem, TMeta> = {
   success: boolean;
   message?: string;
   items?: TItem[];
   paging?: IPagingInfo;
   stepping?: ISteppingInfo;
   meta?: TMeta;
};
