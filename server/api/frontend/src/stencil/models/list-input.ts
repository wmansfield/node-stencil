export interface ListInput {
   skip: number;
   take: number;
   order_by?: string;
   descending?: boolean;
   keyword?: string;
}
