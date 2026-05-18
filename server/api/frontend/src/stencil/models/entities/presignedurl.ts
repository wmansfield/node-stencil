import _ from 'lodash';
import { PartialDeep } from 'type-fest';

import { AssetKind } from './assetkind';
import { AssetDependency } from './assetdependency';
export interface IPreSignedUrl {
  id: string;
  url: string;
  signed_url: string;
  mime_type: string;
  asset_kind: AssetKind;
  dependency?: AssetDependency;
  dependency_id?: string;
  
}


function PreSignedUrl(updates?: PartialDeep<IPreSignedUrl>, original?: PartialDeep<IPreSignedUrl>): IPreSignedUrl {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    id: '',
    url: '',
    signed_url: '',
    mime_type: '',
    asset_kind: AssetKind.image,
    dependency: undefined!,
    dependency_id: undefined!,
    
	});
}

export default PreSignedUrl;