import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface IJurisdictionSettingOption {
  _id: string;
  name: string;
}

export interface IJurisdictionSetting extends IJurisdictionSettingOption  {
  jurisdiction_id: string;
  value?: string;
  updated_utc?: Date,
  created_utc?: Date
}


function JurisdictionSetting(updates?: PartialDeep<IJurisdictionSetting>, original?: PartialDeep<IJurisdictionSetting>): IJurisdictionSetting {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: '',
    name: '',
    jurisdiction_id: '',
    value: undefined!,
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default JurisdictionSetting;