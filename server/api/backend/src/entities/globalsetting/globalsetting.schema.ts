import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'GlobalSetting';
export const PRIMARY_KEY = '_id';

export namespace GlobalSetting {

   
   
   // ===========================================
   // Entity: GlobalSetting
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class GlobalSettingDocument {
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
  
   export const GlobalSettingSchema = SchemaFactory.createForClass(GlobalSettingDocument);
   GlobalSettingSchema.plugin(uuidAutoConversionPlugin);
   GlobalSettingSchema.plugin(mongooseLeanGetters);

   

}