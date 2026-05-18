import { ListInput } from 'src/shared/types/requests/list-input';


export interface ListInputTimezone extends ListInput {
   iana_zone?: string;
   tag?: string;
   
}