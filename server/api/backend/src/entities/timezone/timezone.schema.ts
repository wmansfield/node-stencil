import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'Timezone';
export const PRIMARY_KEY = '_id';

export namespace Timezone {

   
   // ===========================================
   // Projection: Timezone.Public
   // ===========================================
   @Schema()
   export class PublicDocument {
      
      @Prop({
         type: String,
         required: true,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      iana_zone: string;
      
      @Prop({
         type: String,
         required: true,
      })
      ui_sort: string;
      
      @Prop({
         type: String,
         required: true,
      })
      display_name: string;
      
   }

   export const PublicSchema = SchemaFactory.createForClass(PublicDocument);
   PublicSchema.plugin(mongooseLeanGetters);
   PublicSchema.plugin(uuidAutoConversionPlugin);
   
   
   // ===========================================
   // Entity: Timezone
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class TimezoneDocument {
      @Prop({
         type: String,
         required: false,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      iana_zone: string;
      
      @Prop({
         type: String,
         required: true,
      })
      display_name: string;
      
      @Prop({
         type: String,
         required: true,
      })
      ui_sort: string;
      
      @Prop({
         type: String,
         required: false,
      })
      tag: string;
      
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
  
   export const TimezoneSchema = SchemaFactory.createForClass(TimezoneDocument);
   TimezoneSchema.plugin(uuidAutoConversionPlugin);
   TimezoneSchema.plugin(mongooseLeanGetters);

   

}