import _ from 'lodash';
import { PartialDeep } from 'type-fest';

import { ILocalizedText } from './localizedtext';

import { ILocalizedContent } from './localizedcontent';

import { IMediaInfo } from './mediainfo';

import { IFullDate } from './fulldate';

import { IIDPair } from './idpair';

export interface IWidgetOption {
  _id: string;
  title: string;
}

export interface IWidget extends IWidgetOption  {
  jurisdiction_id: string;
  asset_id_media?: string;
  title_localized?: ILocalizedText[];
  description?: string;
  description_localized?: ILocalizedContent[];
  media?: IMediaInfo;
  published_date?: IFullDate;
  reference?: IIDPair;
  avatar?: IMediaInfo;
  updated_utc?: Date,
  created_utc?: Date
}


function Widget(updates?: PartialDeep<IWidget>, original?: PartialDeep<IWidget>): IWidget {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: undefined!,
    jurisdiction_id: '',
    asset_id_media: undefined!,
    title: '',
    title_localized: undefined!,
    description: undefined!,
    description_localized: undefined!,
    media: undefined!,
    published_date: undefined!,
    reference: undefined!,
    avatar: undefined!,
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default Widget;