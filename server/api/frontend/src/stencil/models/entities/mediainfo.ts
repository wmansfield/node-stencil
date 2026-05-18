import _ from 'lodash';
import { PartialDeep } from 'type-fest';

import { IDimension } from './dimension';

import { AssetKind } from './assetkind';
export interface IMediaInfo {
  _id?: string;
  asset_kind?: AssetKind;
  jurisdiction_id?: string;
  storage_key?: string;
  thumb_small_key?: string;
  thumb_small_url?: string;
  thumb_small_dimensions?: IDimension;
  thumb_large_key?: string;
  thumb_large_url?: string;
  thumb_large_dimensions?: IDimension;
  raw_url?: string;
  
}


function MediaInfo(updates?: PartialDeep<IMediaInfo>, original?: PartialDeep<IMediaInfo>): IMediaInfo {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: undefined!,
    asset_kind: undefined!,
    jurisdiction_id: undefined!,
    storage_key: undefined!,
    thumb_small_key: undefined!,
    thumb_small_url: undefined!,
    thumb_small_dimensions: undefined!,
    thumb_large_key: undefined!,
    thumb_large_url: undefined!,
    thumb_large_dimensions: undefined!,
    raw_url: undefined!,
    
	});
}

export default MediaInfo;