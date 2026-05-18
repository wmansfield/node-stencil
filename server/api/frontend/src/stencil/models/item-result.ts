export type ItemResult<TItem> = {
   success: boolean;
   message?: string;
   item?: TItem;
};
export type ItemResultMeta<TItem, TMeta> = {
   success: boolean;
   message?: string;
   item?: TItem;
   meta?: TMeta;
};
