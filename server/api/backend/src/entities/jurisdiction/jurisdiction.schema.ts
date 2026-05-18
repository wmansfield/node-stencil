import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'Jurisdiction';
export const PRIMARY_KEY = '_id';

export namespace Jurisdiction {

   
   // ===========================================
   // Projection: Jurisdiction.Public
   // ===========================================
   @Schema()
   export class PublicDocument {
      
      @Prop({
         type: String,
         required: true,
      })
      _id: string;
      
   }

   export const PublicSchema = SchemaFactory.createForClass(PublicDocument);
   PublicSchema.plugin(mongooseLeanGetters);
   PublicSchema.plugin(uuidAutoConversionPlugin);
   
   
   // ===========================================
   // Entity: Jurisdiction
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class JurisdictionDocument {
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
  
   export const JurisdictionSchema = SchemaFactory.createForClass(JurisdictionDocument);
   JurisdictionSchema.plugin(uuidAutoConversionPlugin);
   JurisdictionSchema.plugin(mongooseLeanGetters);

   

}