import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface IGlobalSettingOption {
  _id: string;
  name: string;
}

export interface IGlobalSetting extends IGlobalSettingOption  {
  value?: string;
  updated_utc?: Date,
  created_utc?: Date
}


function GlobalSetting(updates?: PartialDeep<IGlobalSetting>, original?: PartialDeep<IGlobalSetting>): IGlobalSetting {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: '',
    name: '',
    value: undefined!,
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default GlobalSetting;