import _ from 'lodash';
import { PartialDeep } from 'type-fest';

import { IMediaInfo } from './mediainfo';

import { AccountStatus } from './accountstatus';
export interface IAccountOption {
  _id: string;
  display_name: string;
}

export interface IAccount extends IAccountOption  {
  jurisdiction_id: string;
  asset_id_avatar?: string;
  email: string;
  auth_identifier: string;
  auth_provider: string;
  joined_utc: Date;
  account_status: AccountStatus;
  roles?: string[];
  email_upper: string;
  avatar?: IMediaInfo;
  updated_utc?: Date,
  created_utc?: Date
}

export interface IAccount_Internal {
   _id: string;
   email: string;
   
   updated_utc?: Date
}

export interface IAccount_Public {
   _id: string;
   jurisdiction_id: string;
   display_name?: string;
   avatar?: IMediaInfo;
   
   updated_utc?: Date
}

export interface IAccount_Connection {
   _id: string;
   jurisdiction_id: string;
   display_name?: string;
   avatar?: IMediaInfo;
   
   updated_utc?: Date
}

export interface IAccount_Self {
   _id: string;
   email: string;
   joined_utc: Date;
   display_name?: string;
   roles?: string[];
   account_status: AccountStatus;
   avatar?: IMediaInfo;
   jurisdiction_id: string;
   auth_provider: string;
   token: string;
   impersonated: boolean;
   
   updated_utc?: Date
}

export interface IAccount_Identity {
   _id: string;
   auth_identifier: string;
   
   updated_utc?: Date
}


function Account(updates?: PartialDeep<IAccount>, original?: PartialDeep<IAccount>): IAccount {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: undefined!,
    jurisdiction_id: '',
    asset_id_avatar: undefined!,
    email: '',
    display_name: undefined!,
    auth_identifier: '',
    auth_provider: '',
    joined_utc: undefined!,
    account_status: AccountStatus.disabled,
    roles: undefined!,
    email_upper: undefined!,
    avatar: undefined!,
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default Account;