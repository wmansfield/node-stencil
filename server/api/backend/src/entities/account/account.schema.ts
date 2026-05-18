import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.schema';

import { AccountStatus } from 'src/entities/enums/accountstatus';

export const COLLECTION_NAME = 'Account';
export const PRIMARY_KEY = '_id';

export namespace Account {

   
   // ===========================================
   // Projection: Account.Internal
   // ===========================================
   @Schema()
   export class InternalDocument {
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: true,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      email: string;
      
   }

   export const InternalSchema = SchemaFactory.createForClass(InternalDocument);
   InternalSchema.plugin(mongooseLeanGetters);
   InternalSchema.plugin(uuidAutoConversionPlugin);
   
   // ===========================================
   // Projection: Account.Public
   // ===========================================
   @Schema()
   export class PublicDocument {
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: true,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      jurisdiction_id: string;
      
      @Prop({
         type: String,
         required: false,
      })
      display_name: string;
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      avatar: MediaInfo.MediaInfoDocument;
      
   }

   export const PublicSchema = SchemaFactory.createForClass(PublicDocument);
   PublicSchema.plugin(mongooseLeanGetters);
   PublicSchema.plugin(uuidAutoConversionPlugin);
   
   // ===========================================
   // Projection: Account.Connection
   // ===========================================
   @Schema()
   export class ConnectionDocument {
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: true,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      jurisdiction_id: string;
      
      @Prop({
         type: String,
         required: false,
      })
      display_name: string;
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      avatar: MediaInfo.MediaInfoDocument;
      
   }

   export const ConnectionSchema = SchemaFactory.createForClass(ConnectionDocument);
   ConnectionSchema.plugin(mongooseLeanGetters);
   ConnectionSchema.plugin(uuidAutoConversionPlugin);
   
   // ===========================================
   // Projection: Account.Self
   // ===========================================
   @Schema()
   export class SelfDocument {
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: true,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      email: string;
      
      @Prop({
         type: Date,
         required: true,
      })
      joined_utc: Date;
      
      @Prop({
         type: String,
         required: false,
      })
      display_name: string;
      
      @Prop({
         type: [String],
         required: false,
      })
      roles: string;
      
      @Prop({
         type: Number,
         required: true,
      })
      account_status: AccountStatus;
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      avatar: MediaInfo.MediaInfoDocument;
      
      @Prop({
         type: String,
         required: true,
      })
      jurisdiction_id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      auth_provider: string;
      
   }

   export const SelfSchema = SchemaFactory.createForClass(SelfDocument);
   SelfSchema.plugin(mongooseLeanGetters);
   SelfSchema.plugin(uuidAutoConversionPlugin);
   
   // ===========================================
   // Projection: Account.Identity
   // ===========================================
   @Schema()
   export class IdentityDocument {
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: true,
      })
      _id: string;
      
      @Prop({
         type: String,
         required: true,
      })
      auth_identifier: string;
      
   }

   export const IdentitySchema = SchemaFactory.createForClass(IdentityDocument);
   IdentitySchema.plugin(mongooseLeanGetters);
   IdentitySchema.plugin(uuidAutoConversionPlugin);
   
   
   // ===========================================
   // Entity: Account
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class AccountDocument {
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
         ...ModelAnnotations.uuid,
         required: false,
      })
      asset_id_avatar: string;
      
      @Prop({
         type: String,
         required: true,
      })
      email: string;
      
      @Prop({
         type: String,
         required: false,
      })
      display_name: string;
      
      @Prop({
         type: String,
         required: true,
      })
      auth_identifier: string;
      
      @Prop({
         type: String,
         required: true,
      })
      auth_provider: string;
      
      @Prop({
         type: Date,
         required: true,
      })
      joined_utc: Date;
      
      @Prop({
         type: Number,
         required: true,
      })
      account_status: AccountStatus;
      
      @Prop({
         type: [String],
         required: false,
      })
      roles: string[];
      
      @Prop({
         type: String,
         required: true,
      })
      email_upper: string;
      
      @Prop({
         type: MediaInfo.MediaInfoSchema,
         required: false,
      })
      avatar: MediaInfo.MediaInfoDocument;
      
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
      
      @Prop({
         type: Date,
         required: false,
      })
      calculation_utc?: Date;
      @Prop({
         type: String,
         required: false,
      })
      calculation_agent?: string;
      
   }
  
   export const AccountSchema = SchemaFactory.createForClass(AccountDocument);
   AccountSchema.plugin(uuidAutoConversionPlugin);
   AccountSchema.plugin(mongooseLeanGetters);

   

}