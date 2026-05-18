import _ from 'lodash';
import { PartialDeep } from 'type-fest';

import { IContentSection } from './contentsection';

export interface ILocalizedContent {
  language_code?: string;
  contents?: IContentSection[];
  ui_hash?: string;
  
}


function LocalizedContent(updates?: PartialDeep<ILocalizedContent>, original?: PartialDeep<ILocalizedContent>): ILocalizedContent {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    language_code: undefined!,
    contents: undefined!,
    ui_hash: undefined!,
    
	});
}

export default LocalizedContent;