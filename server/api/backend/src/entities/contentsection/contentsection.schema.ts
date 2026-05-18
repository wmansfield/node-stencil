import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.schema';
import { PreSignedUrl } from 'src/entities/presignedurl/presignedurl.schema';

import { ContentSectionKind } from 'src/entities/enums/contentsectionkind';

export const COLLECTION_NAME = 'ContentSection';
export const PRIMARY_KEY = 'section_kind';

export namespace ContentSection {

   
   
   // ===========================================
   // Entity: ContentSection
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class ContentSectionDocument {
      
      @Prop({
         type: Number,
         required: true,
      })
      section_kind: ContentSectionKind;
      
      @Prop({
         type: String,
         required: false,
      })
      markdown: string;
      
      @Prop({
         type: String,
         required: false,
      })
      text: string;
      
      @Prop({
         type: String,
         required: false,
      })
      target: string;
      
      @Prop({
         type: Number,
         required: false,
      })
      sequence: number;
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: false,
      })
      asset_id: string;
      
      @Prop({
         type: String,
         required: false,
      })
      ui_tag: string;
      
      @Prop({
         type: String,
         required: false,
      })
      ui_text: string;
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      photo: MediaInfo.MediaInfoDocument;
      
      @Prop({
         type: PreSignedUrl.PreSignedUrlSchema,
         required: false,
      })
      upload_info: PreSignedUrl.PreSignedUrlDocument;
      
   }
  
   export const ContentSectionSchema = SchemaFactory.createForClass(ContentSectionDocument);
   ContentSectionSchema.plugin(uuidAutoConversionPlugin);
   ContentSectionSchema.plugin(mongooseLeanGetters);

   

}