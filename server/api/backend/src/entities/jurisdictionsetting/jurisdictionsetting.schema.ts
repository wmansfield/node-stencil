import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'JurisdictionSetting';
export const PRIMARY_KEY = '_id';

export namespace JurisdictionSetting {

   
   
   // ===========================================
   // Entity: JurisdictionSetting
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class JurisdictionSettingDocument {
      @Prop({
         type: String,
         required: false,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      name: string;
      
      @Prop({
         type: String,
         required: true,
      })
      jurisdiction_id: string;
      
      @Prop({
         type: String,
         required: false,
      })
      value: string;
      
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
      
   }
  
   export const JurisdictionSettingSchema = SchemaFactory.createForClass(JurisdictionSettingDocument);
   JurisdictionSettingSchema.plugin(uuidAutoConversionPlugin);
   JurisdictionSettingSchema.plugin(mongooseLeanGetters);

   

}