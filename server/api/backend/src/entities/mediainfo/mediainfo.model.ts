import { Dimension } from 'src/entities/dimension/dimension.model';

import { AssetKind } from 'src/entities/enums/assetkind';
import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class MediaInfo {
   _id?: string;
   asset_kind?: AssetKind;
   jurisdiction_id?: string;
   storage_key?: string;
   thumb_small_key?: string;
   thumb_small_url?: string;
   thumb_small_dimensions?: Dimension;
   thumb_large_key?: string;
   thumb_large_url?: string;
   thumb_large_dimensions?: Dimension;
   raw_url?: string;
   

   constructor(data: Partial<MediaInfo>) {
      Object.assign(this, data);
   }

   static sanitize(obj: MediaInfo): void {
      if (!obj) return;
      obj.jurisdiction_id = sanitizeHtml(obj.jurisdiction_id, false);
      obj.storage_key = sanitizeHtml(obj.storage_key, false);
      obj.thumb_small_key = sanitizeHtml(obj.thumb_small_key, false);
      obj.thumb_small_url = sanitizeHtml(obj.thumb_small_url, true);
      obj.thumb_large_key = sanitizeHtml(obj.thumb_large_key, false);
      obj.thumb_large_url = sanitizeHtml(obj.thumb_large_url, true);
      obj.raw_url = sanitizeHtml(obj.raw_url, true);
      if (obj.thumb_small_dimensions) Dimension.sanitize(obj.thumb_small_dimensions);
      if (obj.thumb_large_dimensions) Dimension.sanitize(obj.thumb_large_dimensions);
   }
}