import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';
import { Dimension } from 'src/entities/dimension/dimension.schema';

import { AssetKind } from 'src/entities/enums/assetkind';
import { AssetDependency } from 'src/entities/enums/assetdependency';

export const COLLECTION_NAME = 'JurisdictionAsset';
export const PRIMARY_KEY = '_id';

export namespace JurisdictionAsset {

   
   // ===========================================
   // Projection: JurisdictionAsset.Info
   // ===========================================
   @Schema()
   export class InfoDocument {
      
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
         type: Number,
         required: true,
      })
      asset_kind: AssetKind;
      
      @Prop({
         type: String,
         required: true,
      })
      storage_key: string;
      
      @Prop({
         type: Dimension.DimensionSchema,
         required: false,
      })
      thumb_dimensions: Dimension.DimensionDocument;
      
      @Prop({
         type: Dimension.DimensionSchema,
         required: false,
      })
      large_dimensions: Dimension.DimensionDocument;
      
      @Prop({
         type: String,
         required: false,
      })
      thumb_small_key: string;
      
      @Prop({
         type: String,
         required: false,
      })
      thumb_large_key: string;
      
      @Prop({
         type: Number,
         required: false,
      })
      duration_secs: number;
      
      @Prop({
         type: Number,
         required: false,
      })
      size_kb: number;
      
   }

   export const InfoSchema = SchemaFactory.createForClass(InfoDocument);
   InfoSchema.plugin(mongooseLeanGetters);
   InfoSchema.plugin(uuidAutoConversionPlugin);
   
   
   // ===========================================
   // Entity: JurisdictionAsset
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class JurisdictionAssetDocument {
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
         type: Number,
         required: true,
      })
      asset_kind: AssetKind;
      
      @Prop({
         type: String,
         required: true,
      })
      file_name: string;
      
      @Prop({
         type: String,
         required: true,
      })
      storage_key: string;
      
      @Prop({
         type: Number,
         required: false,
      })
      size_kb: number;
      
      @Prop({
         type: Number,
         required: false,
      })
      duration_secs: number;
      
      @Prop({
         type: Number,
         required: false,
      })
      dependency: AssetDependency;
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: false,
      })
      account_id_creator: string;
      
      @Prop({
         ...ModelAnnotations.uuid,
         required: false,
      })
      dependency_id: string;
      
      @Prop({
         type: Boolean,
         required: true,
      })
      available: boolean;
      
      @Prop({
         type: Boolean,
         required: true,
      })
      resize_required: boolean;
      
      @Prop({
         type: String,
         required: false,
      })
      resize_status: string;
      
      @Prop({
         type: Number,
         required: false,
      })
      resize_attempts: number;
      
      @Prop({
         type: Date,
         required: false,
      })
      resize_attempt_utc: Date;
      
      @Prop({
         type: String,
         required: false,
      })
      resize_log: string;
      
      @Prop({
         type: Dimension.DimensionSchema,
         required: false,
      })
      thumb_dimensions: Dimension.DimensionDocument;
      
      @Prop({
         type: Dimension.DimensionSchema,
         required: false,
      })
      large_dimensions: Dimension.DimensionDocument;
      
      @Prop({
         type: String,
         required: false,
      })
      thumb_small_key: string;
      
      @Prop({
         type: String,
         required: false,
      })
      thumb_large_key: string;
      
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
  
   export const JurisdictionAssetSchema = SchemaFactory.createForClass(JurisdictionAssetDocument);
   JurisdictionAssetSchema.plugin(uuidAutoConversionPlugin);
   JurisdictionAssetSchema.plugin(mongooseLeanGetters);

   

}