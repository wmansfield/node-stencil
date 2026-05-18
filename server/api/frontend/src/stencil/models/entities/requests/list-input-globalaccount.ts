import { ListInput } from "@/stencil/models/list-input";

export interface IListInputGlobalAccount extends ListInputGlobalAccount {
}
/** Obsolete: Will be removed in a future build, Use IListInputGlobalAccount */
export interface ListInputGlobalAccount extends ListInput {
   jurisdiction_id?: string;
   
}