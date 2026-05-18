import _ from 'lodash';
import { PartialDeep } from 'type-fest';

export interface ILocalizedText {
  language_code?: string;
  text?: string;
  ui_hash?: string;
  
}


function LocalizedText(updates?: PartialDeep<ILocalizedText>, original?: PartialDeep<ILocalizedText>): ILocalizedText {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    language_code: undefined!,
    text: undefined!,
    ui_hash: undefined!,
    
	});
}

export default LocalizedText;