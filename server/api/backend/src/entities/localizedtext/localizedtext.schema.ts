import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'LocalizedText';
export const PRIMARY_KEY = 'language_code';

export namespace LocalizedText {

   
   
   // ===========================================
   // Entity: LocalizedText
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class LocalizedTextDocument {
      
      @Prop({
         type: String,
         required: false,
      })
      language_code: string;
      
      @Prop({
         type: String,
         required: false,
      })
      text: string;
      
      @Prop({
         type: String,
         required: false,
      })
      ui_hash: string;
      
   }
  
   export const LocalizedTextSchema = SchemaFactory.createForClass(LocalizedTextDocument);
   LocalizedTextSchema.plugin(uuidAutoConversionPlugin);
   LocalizedTextSchema.plugin(mongooseLeanGetters);

   

}