import { Dimension } from 'src/entities/dimension/dimension.model';
import { AssetKind } from 'src/entities/enums/assetkind';
import { AssetDependency } from 'src/entities/enums/assetdependency';
import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class JurisdictionAsset {
   static Projection = {
      _id: 1,
      jurisdiction_id: 1,
      asset_kind: 1,
      file_name: 1,
      storage_key: 1,
      size_kb: 1,
      duration_secs: 1,
      dependency: 1,
      account_id_creator: 1,
      capsule_id: 1,
      dependency_id: 1,
      available: 1,
      resize_required: 1,
      resize_status: 1,
      resize_attempts: 1,
      resize_attempt_utc: 1,
      resize_log: 1,
      thumb_dimensions: 1,
      large_dimensions: 1,
      thumb_small_key: 1,
      thumb_large_key: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
   jurisdiction_id: string;
   asset_kind: AssetKind;
   file_name: string;
   storage_key: string;
   size_kb?: number;
   duration_secs?: number;
   dependency?: AssetDependency;
   account_id_creator?: string;
   capsule_id?: string;
   dependency_id?: string;
   available: boolean;
   resize_required: boolean;
   resize_status?: string;
   resize_attempts?: number;
   resize_attempt_utc?: Date;
   resize_log?: string;
   thumb_dimensions?: Dimension;
   large_dimensions?: Dimension;
   thumb_small_key?: string;
   thumb_large_key?: string;
   /**
   * System Field
   */
   created_utc?: Date;
   /**
   * System Field
   */
   updated_utc?: Date;
   
   /**
   * System Field
   */
   searchable?: string;
   

   constructor(data: Partial<JurisdictionAsset>) {
      Object.assign(this, data);
   }

   static sanitize(obj: JurisdictionAsset): void {
      if (!obj) return;
      if (obj.resize_log && obj.resize_log.length > 512) {
         obj.resize_log = truncateStart(obj.resize_log, 512);
      }
      obj.jurisdiction_id = sanitizeHtml(obj.jurisdiction_id, false);
      obj.file_name = sanitizeHtml(obj.file_name, false);
      obj.resize_status = sanitizeHtml(obj.resize_status, false);
      obj.resize_log = sanitizeHtml(obj.resize_log, false);
      if (obj.thumb_dimensions) Dimension.sanitize(obj.thumb_dimensions);
      if (obj.large_dimensions) Dimension.sanitize(obj.large_dimensions);
   }
   
   
   asProcessPerspective(): JurisdictionAsset.ProcessPerspective {
      return new JurisdictionAsset.ProcessPerspective(this);
   }
   
   toInfo(): JurisdictionAsset.Info {
      return JurisdictionAsset.Info.fromJurisdictionAsset(this);
   }
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<JurisdictionAsset>): void {
      
      if (partial.jurisdiction_id !== undefined) {
         this.jurisdiction_id = partial.jurisdiction_id!;
      }
      
      if (partial.asset_kind !== undefined) {
         this.asset_kind = partial.asset_kind!;
      }
      
      if (partial.file_name !== undefined) {
         this.file_name = partial.file_name!;
      }
      
      if (partial.storage_key !== undefined) {
         this.storage_key = partial.storage_key!;
      }
      
      if (partial.size_kb !== undefined) {
         this.size_kb = partial.size_kb!;
      }
      
      if (partial.duration_secs !== undefined) {
         this.duration_secs = partial.duration_secs!;
      }
      
      if (partial.dependency !== undefined) {
         this.dependency = partial.dependency!;
      }
      
      if (partial.account_id_creator !== undefined) {
         this.account_id_creator = partial.account_id_creator!;
      }
      
      if (partial.capsule_id !== undefined) {
         this.capsule_id = partial.capsule_id!;
      }
      
      if (partial.dependency_id !== undefined) {
         this.dependency_id = partial.dependency_id!;
      }
      
      if (partial.available !== undefined) {
         this.available = partial.available!;
      }
      
      if (partial.resize_required !== undefined) {
         this.resize_required = partial.resize_required!;
      }
      
      if (partial.resize_status !== undefined) {
         this.resize_status = partial.resize_status!;
      }
      
      if (partial.resize_attempts !== undefined) {
         this.resize_attempts = partial.resize_attempts!;
      }
      
      if (partial.resize_attempt_utc !== undefined) {
         this.resize_attempt_utc = partial.resize_attempt_utc!;
      }
      
      if (partial.resize_log !== undefined) {
         this.resize_log = partial.resize_log!;
      }
      
      if (partial.thumb_dimensions !== undefined) {
         this.thumb_dimensions = partial.thumb_dimensions!;
      }
      
      if (partial.large_dimensions !== undefined) {
         this.large_dimensions = partial.large_dimensions!;
      }
      
      if (partial.thumb_small_key !== undefined) {
         this.thumb_small_key = partial.thumb_small_key!;
      }
      
      if (partial.thumb_large_key !== undefined) {
         this.thumb_large_key = partial.thumb_large_key!;
      }
      
   }
}


export namespace JurisdictionAsset {
   
   // ===========================================
   // Custom Perspectives
   // ===========================================
   
   export class ProcessPerspective {
      constructor(private actual: JurisdictionAsset) {}
      /**
      * Only use for routing fields (e.g. workspace_id). Do NOT read non-routing fields from
      * the returned object — that bypasses dependency tracking and change detection.
      */
      getActual(): JurisdictionAsset {
         return this.actual;
      }

      get _id(): string {
         return this.actual._id;
      }

      
      set jurisdiction_id(value: string) { 
         this.actual.jurisdiction_id = value;
      }
      
      get jurisdiction_id() : string {
         return this.actual.jurisdiction_id;
      }
      
      set size_kb(value: number | undefined) { 
         this.actual.size_kb = value;
      }
      get size_kb() : number | undefined {
         return this.actual.size_kb;
      }
      
      set duration_secs(value: number | undefined) { 
         this.actual.duration_secs = value;
      }
      get duration_secs() : number | undefined {
         return this.actual.duration_secs;
      }
      
      set dependency(value: AssetDependency | undefined) { 
         this.actual.dependency = value;
      }
      get dependency() : AssetDependency | undefined {
         return this.actual.dependency;
      }
      
      set capsule_id(value: string | undefined) { 
         this.actual.capsule_id = value;
      }
      get capsule_id() : string | undefined {
         return this.actual.capsule_id;
      }
      
      set dependency_id(value: string | undefined) { 
         this.actual.dependency_id = value;
      }
      get dependency_id() : string | undefined {
         return this.actual.dependency_id;
      }
      
      set available(value: boolean) { 
         this.actual.available = value;
      }
      get available()  {
         return this.actual.available;
      }
      
      set resize_required(value: boolean) { 
         this.actual.resize_required = value;
      }
      get resize_required()  {
         return this.actual.resize_required;
      }
      
      set resize_status(value: string | undefined) { 
         this.actual.resize_status = value;
      }
      get resize_status() : string | undefined {
         return this.actual.resize_status;
      }
      
      set resize_attempts(value: number | undefined) { 
         this.actual.resize_attempts = value;
      }
      get resize_attempts() : number | undefined {
         return this.actual.resize_attempts;
      }
      
      set resize_attempt_utc(value: Date | undefined) { 
         this.actual.resize_attempt_utc = value;
      }
      get resize_attempt_utc() : Date | undefined {
         return this.actual.resize_attempt_utc;
      }
      
      set resize_log(value: string | undefined) { 
         this.actual.resize_log = value;
      }
      get resize_log() : string | undefined {
         return this.actual.resize_log;
      }
      
      set thumb_dimensions(value: Dimension | undefined) { 
         this.actual.thumb_dimensions = value;
      }
      get thumb_dimensions() : Dimension | undefined {
         return this.actual.thumb_dimensions;
      }
      
      set large_dimensions(value: Dimension | undefined) { 
         this.actual.large_dimensions = value;
      }
      get large_dimensions() : Dimension | undefined {
         return this.actual.large_dimensions;
      }
      
      set thumb_small_key(value: string | undefined) { 
         this.actual.thumb_small_key = value;
      }
      get thumb_small_key() : string | undefined {
         return this.actual.thumb_small_key;
      }
      
      set thumb_large_key(value: string | undefined) { 
         this.actual.thumb_large_key = value;
      }
      get thumb_large_key() : string | undefined {
         return this.actual.thumb_large_key;
      }
      
   }
   
   // ===========================================
   // Projections
   // ===========================================
   
   export class Info
   {
      static Projection = {
         _id: 1,
         jurisdiction_id: 1,
         asset_kind: 1,
         storage_key: 1,
         thumb_dimensions: 1,
         large_dimensions: 1,
         thumb_small_key: 1,
         thumb_large_key: 1,
         duration_secs: 1,
         size_kb: 1,
         thumb_small_url: 1,
         thumb_large_url: 1,
         raw_url: 1,
         
      };

      static fromJurisdictionAsset(data: JurisdictionAsset) : Info {
         const result = new Info();
         result._id = data._id;
         result.jurisdiction_id = data.jurisdiction_id;
         result.asset_kind = data.asset_kind;
         result.storage_key = data.storage_key;
         result.thumb_dimensions = data.thumb_dimensions;
         result.large_dimensions = data.large_dimensions;
         result.thumb_small_key = data.thumb_small_key;
         result.thumb_large_key = data.thumb_large_key;
         result.duration_secs = data.duration_secs;
         result.size_kb = data.size_kb;
         
         return result;
      }
      static copyToJurisdictionAsset(source: JurisdictionAsset.Info, target: JurisdictionAsset): void {
         //Disallow: target._id = source._id;
         //Disallow: target.jurisdiction_id = source.jurisdiction_id;
         target.asset_kind = source.asset_kind;
         target.storage_key = source.storage_key;
         target.thumb_dimensions = source.thumb_dimensions;
         target.large_dimensions = source.large_dimensions;
         target.thumb_small_key = source.thumb_small_key;
         target.thumb_large_key = source.thumb_large_key;
         target.duration_secs = source.duration_secs;
         target.size_kb = source.size_kb;
         
      }

      _id: string;
      jurisdiction_id: string;
      asset_kind: AssetKind;
      storage_key: string;
      thumb_dimensions?: Dimension;
      large_dimensions?: Dimension;
      thumb_small_key?: string;
      thumb_large_key?: string;
      duration_secs?: number;
      size_kb?: number;
      
      /**
       * Manually Hydrated
       */
      thumb_small_url?: string
      /**
       * Manually Hydrated
       */
      thumb_large_url?: string
      /**
       * Manually Hydrated
       */
      raw_url?: string
   }
   
}