import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';

import { AssetKind } from 'src/entities/enums/assetkind';
import { AssetDependency } from 'src/entities/enums/assetdependency';

export const COLLECTION_NAME = 'PreSignedUrl';
export const PRIMARY_KEY = 'id';

export namespace PreSignedUrl {

   
   
   // ===========================================
   // Entity: PreSignedUrl
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class PreSignedUrlDocument {
      
      @Prop({
         type: String,
         required: true,
      })
      id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      url: string;
      
      @Prop({
         type: String,
         required: true,
      })
      signed_url: string;
      
      @Prop({
         type: String,
         required: true,
      })
      mime_type: string;
      
      @Prop({
         type: Number,
         required: true,
      })
      asset_kind: AssetKind;
      
      @Prop({
         type: Number,
         required: false,
      })
      dependency: AssetDependency;
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: false,
      })
      dependency_id: string;
      
   }
  
   export const PreSignedUrlSchema = SchemaFactory.createForClass(PreSignedUrlDocument);
   PreSignedUrlSchema.plugin(uuidAutoConversionPlugin);
   PreSignedUrlSchema.plugin(mongooseLeanGetters);

   

}