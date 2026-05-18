import _ from 'lodash';
import { PartialDeep } from 'type-fest';

import { IDimension } from './dimension';

import { AssetKind } from './assetkind';
import { AssetDependency } from './assetdependency';
export interface IJurisdictionAssetOption {
  _id: string;
  jurisdiction_id: string;
}

export interface IJurisdictionAsset extends IJurisdictionAssetOption  {
  asset_kind: AssetKind;
  file_name: string;
  storage_key: string;
  size_kb?: number;
  duration_secs?: number;
  dependency?: AssetDependency;
  account_id_creator?: string;
  capsule_id?: string;
  dependency_id?: string;
  available: boolean;
  resize_required: boolean;
  resize_status?: string;
  resize_attempts?: number;
  resize_attempt_utc?: Date;
  resize_log?: string;
  thumb_dimensions?: IDimension;
  large_dimensions?: IDimension;
  thumb_small_key?: string;
  thumb_large_key?: string;
  updated_utc?: Date,
  created_utc?: Date
}

export interface IJurisdictionAsset_Info {
   _id: string;
   jurisdiction_id: string;
   asset_kind: AssetKind;
   storage_key: string;
   thumb_dimensions?: IDimension;
   large_dimensions?: IDimension;
   thumb_small_key?: string;
   thumb_large_key?: string;
   duration_secs?: number;
   size_kb?: number;
   thumb_small_url?: string;
   thumb_large_url?: string;
   raw_url?: string;
   
   updated_utc?: Date
}


function JurisdictionAsset(updates?: PartialDeep<IJurisdictionAsset>, original?: PartialDeep<IJurisdictionAsset>): IJurisdictionAsset {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    _id: undefined!,
    jurisdiction_id: '',
    asset_kind: AssetKind.image,
    file_name: '',
    storage_key: '',
    size_kb: undefined!,
    duration_secs: undefined!,
    dependency: undefined!,
    account_id_creator: undefined!,
    capsule_id: undefined!,
    dependency_id: undefined!,
    available: false,
    resize_required: false,
    resize_status: undefined!,
    resize_attempts: undefined!,
    resize_attempt_utc: undefined!,
    resize_log: undefined!,
    thumb_dimensions: undefined!,
    large_dimensions: undefined!,
    thumb_small_key: undefined!,
    thumb_large_key: undefined!,
    
    created_utc: undefined,
    updated_utc: undefined
	});
}

export default JurisdictionAsset;