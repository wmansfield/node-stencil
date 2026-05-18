import { AssetKind } from 'src/entities/enums/assetkind';
import { AssetDependency } from 'src/entities/enums/assetdependency';
import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class PreSignedUrl {
   id: string;
   url: string;
   signed_url: string;
   mime_type: string;
   asset_kind: AssetKind;
   dependency?: AssetDependency;
   dependency_id?: string;
   

   constructor(data: Partial<PreSignedUrl>) {
      Object.assign(this, data);
   }

   static sanitize(obj: PreSignedUrl): void {
      if (!obj) return;
      obj.id = sanitizeHtml(obj.id, false);
      obj.url = sanitizeHtml(obj.url, true);
      obj.signed_url = sanitizeHtml(obj.signed_url, true);
      obj.mime_type = sanitizeHtml(obj.mime_type, false);
   }
}