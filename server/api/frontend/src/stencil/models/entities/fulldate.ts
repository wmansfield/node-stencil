import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface IFullDate {
  utc?: Date;
  local?: string;
  literal: string;
  iana_zone: string;
  
}


function FullDate(updates?: PartialDeep<IFullDate>, original?: PartialDeep<IFullDate>): IFullDate {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    utc: undefined!,
    local: undefined!,
    literal: '',
    iana_zone: '',
    
	});
}

export default FullDate;