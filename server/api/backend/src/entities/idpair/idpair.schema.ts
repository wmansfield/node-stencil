import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'IDPair';
export const PRIMARY_KEY = '_id';

export namespace IDPair {

   
   
   // ===========================================
   // Entity: IDPair
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class IDPairDocument {
      
      @Prop({
         type: String,
         required: true,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      text: string;
      
   }
  
   export const IDPairSchema = SchemaFactory.createForClass(IDPairDocument);
   IDPairSchema.plugin(uuidAutoConversionPlugin);
   IDPairSchema.plugin(mongooseLeanGetters);

   

}