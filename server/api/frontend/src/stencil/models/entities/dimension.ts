import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface IDimension {
  width: number;
  height: number;
  
}


function Dimension(updates?: PartialDeep<IDimension>, original?: PartialDeep<IDimension>): IDimension {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    width: 0,
    height: 0,
    
	});
}

export default Dimension;