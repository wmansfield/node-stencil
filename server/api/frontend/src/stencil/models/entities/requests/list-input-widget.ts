import { ListInput } from "@/stencil/models/list-input";

export interface IListInputWidget extends ListInputWidget {
}
/** Obsolete: Will be removed in a future build, Use IListInputWidget */
export interface ListInputWidget extends ListInput {
   asset_id_media?: string;
   
}