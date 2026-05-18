import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface IJurisdictionOption {
  _id: string;
  jurisdiction_id: string;
}

export interface IJurisdiction extends IJurisdictionOption  {
  updated_utc?: Date,
  created_utc?: Date
}

export interface IJurisdiction_Public {
   _id: string;
   
   updated_utc?: Date
}


function Jurisdiction(updates?: PartialDeep<IJurisdiction>, original?: PartialDeep<IJurisdiction>): IJurisdiction {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: '',
    jurisdiction_id: '',
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default Jurisdiction;