import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';
import { ContentSection } from 'src/entities/contentsection/contentsection.schema';


export const COLLECTION_NAME = 'LocalizedContent';
export const PRIMARY_KEY = 'language_code';

export namespace LocalizedContent {

   
   
   // ===========================================
   // Entity: LocalizedContent
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class LocalizedContentDocument {
      
      @Prop({
         type: String,
         required: false,
      })
      language_code: string;
      
      @Prop({
         type: [ContentSection.ContentSectionSchema],
         required: false,
      })
      contents: ContentSection.ContentSectionDocument[];
      
      @Prop({
         type: String,
         required: false,
      })
      ui_hash: string;
      
   }
  
   export const LocalizedContentSchema = SchemaFactory.createForClass(LocalizedContentDocument);
   LocalizedContentSchema.plugin(uuidAutoConversionPlugin);
   LocalizedContentSchema.plugin(mongooseLeanGetters);

   

}