import { ListInput } from "@/stencil/models/list-input";

export interface IListInputRole extends ListInputRole {
}
/** Obsolete: Will be removed in a future build, Use IListInputRole */
export interface ListInputRole extends ListInput {
   role_name?: string;
   
}