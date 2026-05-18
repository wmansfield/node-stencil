import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'Dimension';
export const PRIMARY_KEY = 'width';

export namespace Dimension {

   
   
   // ===========================================
   // Entity: Dimension
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class DimensionDocument {
      
      @Prop({
         type: Number,
         required: true,
      })
      width: number;
      
      @Prop({
         type: Number,
         required: true,
      })
      height: number;
      
   }
  
   export const DimensionSchema = SchemaFactory.createForClass(DimensionDocument);
   DimensionSchema.plugin(uuidAutoConversionPlugin);
   DimensionSchema.plugin(mongooseLeanGetters);

   

}