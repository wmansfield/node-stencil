import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface ITimezoneOption {
  _id: string;
  iana_zone: string;
}

export interface ITimezone extends ITimezoneOption  {
  display_name: string;
  ui_sort: string;
  tag?: string;
  updated_utc?: Date,
  created_utc?: Date
}

export interface ITimezone_Public {
   _id: string;
   iana_zone: string;
   ui_sort: string;
   display_name: string;
   
   updated_utc?: Date
}


function Timezone(updates?: PartialDeep<ITimezone>, original?: PartialDeep<ITimezone>): ITimezone {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: '',
    iana_zone: '',
    display_name: '',
    ui_sort: '',
    tag: undefined!,
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default Timezone;