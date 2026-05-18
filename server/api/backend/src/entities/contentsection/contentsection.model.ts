import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';
import { PreSignedUrl } from 'src/entities/presignedurl/presignedurl.model';

import { ContentSectionKind } from 'src/entities/enums/contentsectionkind';
import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class ContentSection {
   section_kind: ContentSectionKind;
   markdown?: string;
   text?: string;
   target?: string;
   sequence?: number;
   asset_id?: string;
   ui_tag?: string;
   ui_text?: string;
   photo?: MediaInfo;
   upload_info?: PreSignedUrl;
   

   constructor(data: Partial<ContentSection>) {
      Object.assign(this, data);
   }

   static sanitize(obj: ContentSection): void {
      if (!obj) return;
      obj.markdown = sanitizeHtml(obj.markdown, false);
      obj.text = sanitizeHtml(obj.text, false);
      obj.target = sanitizeHtml(obj.target, false);
      obj.ui_tag = sanitizeHtml(obj.ui_tag, false);
      obj.ui_text = sanitizeHtml(obj.ui_text, false);
      if (obj.photo) MediaInfo.sanitize(obj.photo);
      if (obj.upload_info) PreSignedUrl.sanitize(obj.upload_info);
   }
}