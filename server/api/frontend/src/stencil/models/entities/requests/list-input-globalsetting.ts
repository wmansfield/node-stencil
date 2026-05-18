import { ListInput } from "@/stencil/models/list-input";

export interface IListInputGlobalSetting extends ListInputGlobalSetting {
}
/** Obsolete: Will be removed in a future build, Use IListInputGlobalSetting */
export interface ListInputGlobalSetting extends ListInput {
   name?: string;
   
}