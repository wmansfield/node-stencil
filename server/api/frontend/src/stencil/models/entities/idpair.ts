import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface IIDPair {
  _id: string;
  text: string;
  
}


function IDPair(updates?: PartialDeep<IIDPair>, original?: PartialDeep<IIDPair>): IIDPair {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: '',
    text: '',
    
	});
}

export default IDPair;