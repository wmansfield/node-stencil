import { ListInput } from "@/stencil/models/list-input";
import { AccountStatus } from "@/stencil/models/entities/accountstatus"

export interface IListInputAccount extends ListInputAccount {
}
/** Obsolete: Will be removed in a future build, Use IListInputAccount */
export interface ListInputAccount extends ListInput {
   asset_id_avatar?: string;
   
}