import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface IGlobalAccountOption {
  _id: string;
  auth_identifier: string;
}

export interface IGlobalAccount extends IGlobalAccountOption  {
  jurisdiction_id: string;
  updated_utc?: Date,
  created_utc?: Date
}


function GlobalAccount(updates?: PartialDeep<IGlobalAccount>, original?: PartialDeep<IGlobalAccount>): IGlobalAccount {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: undefined!,
    auth_identifier: '',
    jurisdiction_id: '',
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default GlobalAccount;