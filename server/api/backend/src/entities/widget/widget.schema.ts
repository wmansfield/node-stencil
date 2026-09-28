import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';
import { LocalizedText } from 'src/entities/localizedtext/localizedtext.schema';
import { ContentSection } from 'src/entities/contentsection/contentsection.schema';
import { LocalizedContent } from 'src/entities/localizedcontent/localizedcontent.schema';
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.schema';
import { FullDate } from 'src/entities/fulldate/fulldate.schema';
import { IDPair } from 'src/entities/idpair/idpair.schema';


export const COLLECTION_NAME = 'Widget';
export const PRIMARY_KEY = '_id';

export namespace Widget {

   
   // ===========================================
   // Projection: Widget.Public
   // ===========================================
   @Schema()
   export class PublicDocument {
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: true,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      jurisdiction_id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      title: string;
      
      @Prop({
         type: [ContentSection.ContentSectionSchema],
         required: false,
      })
      description: ContentSection.ContentSectionDocument;
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      media: MediaInfo.MediaInfoDocument;
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      avatar: MediaInfo.MediaInfoDocument;
      
      @Prop({
         type: FullDate.FullDateSchema,
         required: false,
      })
      published_date: FullDate.FullDateDocument;
      
   }

   export const PublicSchema = SchemaFactory.createForClass(PublicDocument);
   PublicSchema.plugin(mongooseLeanGetters);
   PublicSchema.plugin(uuidAutoConversionPlugin);
   
   
   // ===========================================
   // Entity: Widget
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class WidgetDocument {
      @Prop({
         type: String,
         required: false,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      jurisdiction_id: string;
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: false,
      })
      asset_id_media: string;
      
      @Prop({
         type: String,
         required: true,
      })
      title: string;
      
      @Prop({
         type: [LocalizedText.LocalizedTextSchema],
         required: false,
      })
      title_localized: LocalizedText.LocalizedTextDocument[];
      
      @Prop({
         type: [ContentSection.ContentSectionSchema],
         required: false,
      })
      description: ContentSection.ContentSectionDocument[];
      
      @Prop({
         type: [LocalizedContent.LocalizedContentSchema],
         required: false,
      })
      description_localized: LocalizedContent.LocalizedContentDocument[];
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      media: MediaInfo.MediaInfoDocument;
      
      @Prop({
         type: FullDate.FullDateSchema,
         required: false,
      })
      published_date: FullDate.FullDateDocument;
      
      @Prop({
         type: IDPair.IDPairSchema,
         required: false,
      })
      reference: IDPair.IDPairDocument;
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      avatar: MediaInfo.MediaInfoDocument;
      
      @Prop({
         type: Date,
         required: true,
      })
      created_utc: Date;
      
      @Prop({
         type: Date,
         required: true,
      })
      updated_utc: Date;
      
      @Prop({
         type: String,
         required: true,
      })
      searchable?: string;
      
      @Prop({
         type: Date,
         required: false,
      })
      calculation_utc?: Date;
      @Prop({
         type: String,
         required: false,
      })
      calculation_agent?: string;
      
   }
  
   export const WidgetSchema = SchemaFactory.createForClass(WidgetDocument);
   WidgetSchema.plugin(uuidAutoConversionPlugin);
   WidgetSchema.plugin(mongooseLeanGetters);

   

}