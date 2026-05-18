import { ListInput } from "@/stencil/models/list-input";

export interface IListInputJurisdiction extends ListInputJurisdiction {
}
/** Obsolete: Will be removed in a future build, Use IListInputJurisdiction */
export interface ListInputJurisdiction extends ListInput {
   jurisdiction_id?: string;
   
}