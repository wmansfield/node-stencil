import { ListInput } from "@/stencil/models/list-input";

export interface IListInputTimezone extends ListInputTimezone {
}
/** Obsolete: Will be removed in a future build, Use IListInputTimezone */
export interface ListInputTimezone extends ListInput {
   iana_zone?: string;
   tag?: string;
   
}