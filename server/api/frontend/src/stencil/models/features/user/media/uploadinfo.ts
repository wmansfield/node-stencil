import { AssetKind } from '@/stencil/models/entities/assetkind';
import { AssetArea } from '@/stencil/models/entities/assetarea';

export interface IUploadInfo {
	asset_kind: AssetKind;
   asset_area: AssetArea;
   file_name: string;
   mime_type: string;
   size_kb?: number;
   duration_secs?: number;
   jurisdiction_id: string;
   
}