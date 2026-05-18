import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';


export const COLLECTION_NAME = 'Role';
export const PRIMARY_KEY = '_id';

export namespace Role {

   
   
   // ===========================================
   // Entity: Role
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class RoleDocument {
      @Prop({
         type: String,
         required: false,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      role_name: string;
      
      @Prop({
         type: [String],
         required: true,
      })
      permissions: string[];
      
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
  
   export const RoleSchema = SchemaFactory.createForClass(RoleDocument);
   RoleSchema.plugin(uuidAutoConversionPlugin);
   RoleSchema.plugin(mongooseLeanGetters);

   

}