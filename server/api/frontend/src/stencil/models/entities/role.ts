import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface IRoleOption {
  _id: string;
  role_name: string;
}

export interface IRole extends IRoleOption  {
  permissions: string[];
  updated_utc?: Date,
  created_utc?: Date
}


function Role(updates?: PartialDeep<IRole>, original?: PartialDeep<IRole>): IRole {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: '',
    role_name: '',
    permissions: undefined!,
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default Role;