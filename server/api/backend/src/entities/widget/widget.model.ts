import { LocalizedText } from 'src/entities/localizedtext/localizedtext.model';
import { LocalizedContent } from 'src/entities/localizedcontent/localizedcontent.model';
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';
import { FullDate } from 'src/entities/fulldate/fulldate.model';
import { IDPair } from 'src/entities/idpair/idpair.model';
import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class Widget {
   static Projection = {
      _id: 1,
      jurisdiction_id: 1,
      asset_id_media: 1,
      title: 1,
      title_localized: 1,
      description: 1,
      description_localized: 1,
      media: 1,
      published_date: 1,
      reference: 1,
      avatar: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
   jurisdiction_id: string;
   asset_id_media?: string;
   title: string;
   title_localized?: LocalizedText[];
   description?: string;
   description_localized?: LocalizedContent[];
   /**
   * Calculated Field
   */
   media?: MediaInfo;
   published_date?: FullDate;
   reference?: IDPair;
   /**
   * Calculated Field
   */
   avatar?: MediaInfo;
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
   
   /**
   * System Field
   */
   calculation_utc?: Date;
   /**
   * System Field
   */
   calculation_agent?: string ;
   /**
   * System Field
   */
   calculation_reason?: string;
   

   constructor(data: Partial<Widget>) {
      Object.assign(this, data);
   }

   static sanitize(obj: Widget): void {
      if (!obj) return;
      obj.jurisdiction_id = sanitizeHtml(obj.jurisdiction_id, false);
      obj.title = sanitizeHtml(obj.title, false);
      obj.description = sanitizeHtml(obj.description, false);
      obj.title_localized?.forEach(item => LocalizedText.sanitize(item));
      obj.description_localized?.forEach(item => LocalizedContent.sanitize(item));
      if (obj.media) MediaInfo.sanitize(obj.media);
      if (obj.published_date) FullDate.sanitize(obj.published_date);
      if (obj.reference) IDPair.sanitize(obj.reference);
      if (obj.avatar) MediaInfo.sanitize(obj.avatar);
   }
   
   
   asConfigPerspective(): Widget.ConfigPerspective {
      return new Widget.ConfigPerspective(this);
   }
   
   calculationMarkDirty(agent:string, reason?:string): void {
      this.calculation_utc = undefined;
      this.calculation_agent = agent;
      this.calculation_reason = reason;
   }
   calculationMarkClean(stamp_utc?: Date): void {
      this.calculation_utc = stamp_utc ?? new Date();
      this.calculation_agent = undefined;
      this.calculation_reason = undefined;
   }
   
   asCalculationsPerspective(): Widget.CalculationsPerspective {
      return new Widget.CalculationsPerspective(this);
   }
   
   forCalculation(): Widget.CalculationSource {
      return new Widget.CalculationSource(this);
   }
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<Widget>): void {
      
      if (partial.jurisdiction_id !== undefined) {
         this.jurisdiction_id = partial.jurisdiction_id!;
      }
      
      if (partial.asset_id_media !== undefined) {
         this.asset_id_media = partial.asset_id_media!;
      }
      
      if (partial.title !== undefined) {
         this.title = partial.title!;
      }
      
      if (partial.title_localized !== undefined) {
         this.title_localized = partial.title_localized!;
      }
      
      if (partial.description !== undefined) {
         this.description = partial.description!;
      }
      
      if (partial.description_localized !== undefined) {
         this.description_localized = partial.description_localized!;
      }
      
      if (partial.published_date !== undefined) {
         this.published_date = partial.published_date!;
      }
      
      if (partial.reference !== undefined) {
         this.reference = partial.reference!;
      }
      
   }
}


export namespace Widget {
   
   // ===========================================
   // Calculation Perspective
   // ===========================================
   export class CalculationsPerspective
   {
      static PROPERTIES:string[] = ["media", "avatar"];

      constructor(actual:Widget) {
         this.actual = actual;
      }
      
      private actual: Widget;

      get _id(): string { 
         return this.actual._id;
      }
      get jurisdiction_id(): string  { 
         return this.actual.jurisdiction_id;
      }
      
      get media(): MediaInfo | undefined  { 
         return this.actual.media;
      }
      set media(value: MediaInfo | undefined ) { 
         this.actual.media = value;
      }
      
      get avatar(): MediaInfo | undefined  { 
         return this.actual.avatar;
      }
      set avatar(value: MediaInfo | undefined ) { 
         this.actual.avatar = value;
      }
      
      get calculation_agent(): string | undefined { 
         return this.actual.calculation_agent;
      }
      set calculation_agent(value:string) { 
         this.actual.calculation_agent = value;
      }

      get calculation_utc(): Date | undefined { 
         return this.actual.calculation_utc;
      }
      set calculation_utc(value: Date | undefined) { 
         this.actual.calculation_utc = value;
      }
      
      calculationMarkDirty(agent:string, reason?:string): void {
         const actual:Widget  = this.getActual();
         actual.calculation_utc = undefined;
         actual.calculation_agent = agent;
         actual.calculation_reason = reason;
      }

      calculationMarkClean(stamp_utc: Date | undefined): void {
         const actual:Widget = this.getActual();
         actual.calculation_utc = stamp_utc ?? new Date();
         actual.calculation_agent = undefined;
         actual.calculation_reason = undefined;
      }

      getActual(): Widget {
         return this.actual;
      }

      copyCalculationsToOther(other:CalculationsPerspective): void {
         if (!!other) {
            other.media = this.media;
            other.avatar = this.avatar;
         }
      }

      hasField(properties:string[]): boolean {
         if (!properties || properties.length == 0) {
            return false;
         }
         return CalculationsPerspective.PROPERTIES.some(x => properties.includes(x));
      }
   }

   // ===========================================
   // Synchronization Projection
   // ===========================================
   export class Synchronization
   {
      static Projection = {
         _id: 1,
         jurisdiction_id: 1
      };

      _id: string;
      jurisdiction_id: string;
      
   }

   
   export class CalculationSource
   {
      constructor(actual: Widget) {
         this.actual = actual;
      }
      private actual:Widget;

      get _id(): string { 
         return this.actual._id;
      }

      
      get asset_id_media(): string | undefined { 
         return this.actual.asset_id_media;
      }
      set asset_id_media(value: string | undefined) { 
         this.actual.asset_id_media = value;
      }
      
      get title_localized(): LocalizedText[] | undefined { 
         return this.actual.title_localized;
      }
      set title_localized(value: LocalizedText[] | undefined) { 
         this.actual.title_localized = value;
      }
      
      get description_localized(): LocalizedContent[] | undefined { 
         return this.actual.description_localized;
      }
      set description_localized(value: LocalizedContent[] | undefined) { 
         this.actual.description_localized = value;
      }
      

      /**
      * WARNING: Only use for routing fields (e.g. workspace_id). NEVER read fields here for
      * calculation logic — that bypasses change detection. If applyCalculations needs a field,
      * mark it recalculate="true" in the XML so it appears directly on CalculationSource.
      */
      getActual(): Widget {
         return this.actual;
      }
   }

   
   // ===========================================
   // Custom Perspectives
   // ===========================================
   
   export class ConfigPerspective {
      constructor(private actual: Widget) {}
      /**
      * Only use for routing fields (e.g. workspace_id). Do NOT read non-routing fields from
      * the returned object — that bypasses dependency tracking and change detection.
      */
      getActual(): Widget {
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
      
      set title_localized(value: LocalizedText[] | undefined) { 
         this.actual.title_localized = value;
      }
      get title_localized() : LocalizedText[] | undefined {
         return this.actual.title_localized;
      }
      
      set description(value: string | undefined) { 
         this.actual.description = value;
      }
      get description() : string | undefined {
         return this.actual.description;
      }
      
      set description_localized(value: LocalizedContent[] | undefined) { 
         this.actual.description_localized = value;
      }
      get description_localized() : LocalizedContent[] | undefined {
         return this.actual.description_localized;
      }
      
   }
   
}