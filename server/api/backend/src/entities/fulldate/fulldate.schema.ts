import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'FullDate';
export const PRIMARY_KEY = 'utc';

export namespace FullDate {

   
   
   // ===========================================
   // Entity: FullDate
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class FullDateDocument {
      
      @Prop({
         type: Date,
         required: false,
      })
      utc: Date;
      
      @Prop({
         type: String,
         required: false,
      })
      local: string;
      
      @Prop({
         type: String,
         required: true,
      })
      literal: string;
      
      @Prop({
         type: String,
         required: true,
      })
      iana_zone: string;
      
   }
  
   export const FullDateSchema = SchemaFactory.createForClass(FullDateDocument);
   FullDateSchema.plugin(uuidAutoConversionPlugin);
   FullDateSchema.plugin(mongooseLeanGetters);

   

}