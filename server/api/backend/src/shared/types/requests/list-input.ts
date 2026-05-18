/**
 * Base list input for pagination and search
 * All entity-specific ListInput types extend this
 */
export interface ListInput {
   skip: number;
   take: number;
   order_by?: string;
   descending?: boolean;
   keyword?: string;
}
