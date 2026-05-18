import _ from 'lodash';
import { PartialDeep } from 'type-fest';

import { IMediaInfo } from './mediainfo';

import { IPreSignedUrl } from './presignedurl';

import { ContentSectionKind } from './contentsectionkind';
export interface IContentSection {
  section_kind: ContentSectionKind;
  markdown?: string;
  text?: string;
  target?: string;
  sequence?: number;
  asset_id?: string;
  ui_tag?: string;
  ui_text?: string;
  photo?: IMediaInfo;
  upload_info?: IPreSignedUrl;
  
}


function ContentSection(updates?: PartialDeep<IContentSection>, original?: PartialDeep<IContentSection>): IContentSection {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    section_kind: ContentSectionKind.markdown,
    markdown: undefined!,
    text: undefined!,
    target: undefined!,
    sequence: undefined!,
    asset_id: undefined!,
    ui_tag: undefined!,
    ui_text: undefined!,
    photo: undefined!,
    upload_info: undefined!,
    
	});
}

export default ContentSection;