import { ListInput } from "@/stencil/models/list-input";

export interface IListInputJurisdictionSetting extends ListInputJurisdictionSetting {
}
/** Obsolete: Will be removed in a future build, Use IListInputJurisdictionSetting */
export interface ListInputJurisdictionSetting extends ListInput {
   name?: string;
   
}