import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';
import { Dimension } from 'src/entities/dimension/dimension.schema';

import { AssetKind } from 'src/entities/enums/assetkind';

export const COLLECTION_NAME = 'MediaInfo';
export const PRIMARY_KEY = '_id';

export namespace MediaInfo {

   
   
   // ===========================================
   // Entity: MediaInfo
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class MediaInfoDocument {
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: false,
      })
      _id: string;
      
      @Prop({
         type: Number,
         required: false,
      })
      asset_kind: AssetKind;
      
      @Prop({
         type: String,
         required: false,
      })
      jurisdiction_id: string;
      
      @Prop({
         type: String,
         required: false,
      })
      storage_key: string;
      
      @Prop({
         type: String,
         required: false,
      })
      thumb_small_key: string;
      
      @Prop({
         type: String,
         required: false,
      })
      thumb_small_url: string;
      
      @Prop({
         type: Dimension.DimensionSchema,
         required: false,
      })
      thumb_small_dimensions: Dimension.DimensionDocument;
      
      @Prop({
         type: String,
         required: false,
      })
      thumb_large_key: string;
      
      @Prop({
         type: String,
         required: false,
      })
      thumb_large_url: string;
      
      @Prop({
         type: Dimension.DimensionSchema,
         required: false,
      })
      thumb_large_dimensions: Dimension.DimensionDocument;
      
      @Prop({
         type: String,
         required: false,
      })
      raw_url: string;
      
   }
  
   export const MediaInfoSchema = SchemaFactory.createForClass(MediaInfoDocument);
   MediaInfoSchema.plugin(uuidAutoConversionPlugin);
   MediaInfoSchema.plugin(mongooseLeanGetters);

   

}