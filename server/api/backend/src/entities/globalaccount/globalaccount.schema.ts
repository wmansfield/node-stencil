import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'GlobalAccount';
export const PRIMARY_KEY = '_id';

export namespace GlobalAccount {

   
   
   // ===========================================
   // Entity: GlobalAccount
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class GlobalAccountDocument {
      @Prop({
         type: String,
         required: false,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      auth_identifier: string;
      
      @Prop({
         type: String,
         required: true,
      })
      jurisdiction_id: string;
      
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
  
   export const GlobalAccountSchema = SchemaFactory.createForClass(GlobalAccountDocument);
   GlobalAccountSchema.plugin(uuidAutoConversionPlugin);
   GlobalAccountSchema.plugin(mongooseLeanGetters);

   

}