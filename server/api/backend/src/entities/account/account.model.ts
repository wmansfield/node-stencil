import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';
import { AccountStatus } from 'src/entities/enums/accountstatus';
import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';
// ===========================================
// Entity
// ===========================================

export class Account {
   static Projection = {
      _id: 1,
      jurisdiction_id: 1,
      asset_id_avatar: 1,
      email: 1,
      display_name: 1,
      auth_identifier: 1,
      auth_provider: 1,
      joined_utc: 1,
      account_status: 1,
      roles: 1,
      email_upper: 1,
      avatar: 1,
      created_utc: 1,
      updated_utc: 1,
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   
   };

   _id: string;
   jurisdiction_id: string;
   asset_id_avatar?: string;
   email: string;
   display_name?: string;
   auth_identifier: string;
   auth_provider: string;
   joined_utc: Date;
   account_status: AccountStatus;
   roles?: string[];
   /**
   * Calculated Field
   */
   email_upper: string;
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
   

   constructor(data: Partial<Account>) {
      Object.assign(this, data);
   }

   static sanitize(obj: Account): void {
      if (!obj) return;
      obj.jurisdiction_id = sanitizeHtml(obj.jurisdiction_id, false);
      obj.email = sanitizeHtml(obj.email, false);
      obj.display_name = sanitizeHtml(obj.display_name, false);
      obj.auth_identifier = sanitizeHtml(obj.auth_identifier, false);
      obj.auth_provider = sanitizeHtml(obj.auth_provider, false);
      obj.email_upper = sanitizeHtml(obj.email_upper, false);
      if (obj.avatar) MediaInfo.sanitize(obj.avatar);
   }
   
   
   asInfoPerspective(): Account.InfoPerspective {
      return new Account.InfoPerspective(this);
   }
   
   asStatusPerspective(): Account.StatusPerspective {
      return new Account.StatusPerspective(this);
   }
   
   asPermissionsPerspective(): Account.PermissionsPerspective {
      return new Account.PermissionsPerspective(this);
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
   
   asCalculationsPerspective(): Account.CalculationsPerspective {
      return new Account.CalculationsPerspective(this);
   }
   
   forCalculation(): Account.CalculationSource {
      return new Account.CalculationSource(this);
   }
   
   toInternal(): Account.Internal {
      return Account.Internal.fromAccount(this);
   }
   
   toPublic(): Account.Public {
      return Account.Public.fromAccount(this);
   }
   
   toConnection(): Account.Connection {
      return Account.Connection.fromAccount(this);
   }
   
   toSelf(): Account.Self {
      return Account.Self.fromAccount(this);
   }
   
   toIdentity(): Account.Identity {
      return Account.Identity.fromAccount(this);
   }
   

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial<Account>): void {
      
      if (partial.jurisdiction_id !== undefined) {
         this.jurisdiction_id = partial.jurisdiction_id!;
      }
      
      if (partial.asset_id_avatar !== undefined) {
         this.asset_id_avatar = partial.asset_id_avatar!;
      }
      
      if (partial.email !== undefined) {
         this.email = partial.email!;
      }
      
      if (partial.display_name !== undefined) {
         this.display_name = partial.display_name!;
      }
      
      if (partial.auth_identifier !== undefined) {
         this.auth_identifier = partial.auth_identifier!;
      }
      
      if (partial.auth_provider !== undefined) {
         this.auth_provider = partial.auth_provider!;
      }
      
      if (partial.joined_utc !== undefined) {
         this.joined_utc = partial.joined_utc!;
      }
      
      if (partial.account_status !== undefined) {
         this.account_status = partial.account_status!;
      }
      
      if (partial.roles !== undefined) {
         this.roles = partial.roles!;
      }
      
   }
}


export namespace Account {
   
   // ===========================================
   // Calculation Perspective
   // ===========================================
   export class CalculationsPerspective
   {
      static PROPERTIES:string[] = ["email_upper", "avatar"];

      constructor(actual:Account) {
         this.actual = actual;
      }
      
      private actual: Account;

      get _id(): string { 
         return this.actual._id;
      }
      get jurisdiction_id(): string  { 
         return this.actual.jurisdiction_id;
      }
      
      get email_upper(): string  { 
         return this.actual.email_upper;
      }
      set email_upper(value: string ) { 
         this.actual.email_upper = value;
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
         const actual:Account  = this.getActual();
         actual.calculation_utc = undefined;
         actual.calculation_agent = agent;
         actual.calculation_reason = reason;
      }

      calculationMarkClean(stamp_utc: Date | undefined): void {
         const actual:Account = this.getActual();
         actual.calculation_utc = stamp_utc ?? new Date();
         actual.calculation_agent = undefined;
         actual.calculation_reason = undefined;
      }

      getActual(): Account {
         return this.actual;
      }

      copyCalculationsToOther(other:CalculationsPerspective): void {
         if (!!other) {
            other.email_upper = this.email_upper;
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
      constructor(actual: Account) {
         this.actual = actual;
      }
      private actual:Account;

      get _id(): string { 
         return this.actual._id;
      }

      
      get asset_id_avatar(): string | undefined { 
         return this.actual.asset_id_avatar;
      }
      set asset_id_avatar(value: string | undefined) { 
         this.actual.asset_id_avatar = value;
      }
      
      get email(): string { 
         return this.actual.email;
      }
      set email(value: string) { 
         this.actual.email = value;
      }
      

      /**
      * WARNING: Only use for routing fields (e.g. workspace_id). NEVER read fields here for
      * calculation logic — that bypasses change detection. If applyCalculations needs a field,
      * mark it recalculate="true" in the XML so it appears directly on CalculationSource.
      */
      getActual(): Account {
         return this.actual;
      }
   }

   
   // ===========================================
   // Custom Perspectives
   // ===========================================
   
   export class InfoPerspective {
      constructor(private actual: Account) {}
      /**
      * Only use for routing fields (e.g. workspace_id). Do NOT read non-routing fields from
      * the returned object — that bypasses dependency tracking and change detection.
      */
      getActual(): Account {
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
      
      set asset_id_avatar(value: string | undefined) { 
         this.actual.asset_id_avatar = value;
      }
      get asset_id_avatar() : string | undefined {
         return this.actual.asset_id_avatar;
      }
      
      set display_name(value: string | undefined) { 
         this.actual.display_name = value;
      }
      get display_name() : string | undefined {
         return this.actual.display_name;
      }
      
   }
   
   export class StatusPerspective {
      constructor(private actual: Account) {}
      /**
      * Only use for routing fields (e.g. workspace_id). Do NOT read non-routing fields from
      * the returned object — that bypasses dependency tracking and change detection.
      */
      getActual(): Account {
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
      
      set email(value: string) { 
         this.actual.email = value;
      }
      get email()  {
         return this.actual.email;
      }
      
      set account_status(value: AccountStatus) { 
         this.actual.account_status = value;
      }
      get account_status()  {
         return this.actual.account_status;
      }
      
   }
   
   export class PermissionsPerspective {
      constructor(private actual: Account) {}
      /**
      * Only use for routing fields (e.g. workspace_id). Do NOT read non-routing fields from
      * the returned object — that bypasses dependency tracking and change detection.
      */
      getActual(): Account {
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
      
      set roles(value: string[] | undefined) { 
         this.actual.roles = value;
      }
      get roles() : string[] | undefined {
         return this.actual.roles;
      }
      
   }
   
   // ===========================================
   // Projections
   // ===========================================
   
   export class Internal
   {
      static Projection = {
         _id: 1,
         email: 1,
         
      };

      static fromAccount(data: Account) : Internal {
         const result = new Internal();
         result._id = data._id;
         result.email = data.email;
         
         return result;
      }
      static copyToAccount(source: Account.Internal, target: Account): void {
         //Disallow: target._id = source._id;
         target.email = source.email;
         
      }

      _id: string;
      email: string;
      
   }
   
   export class Public
   {
      static Projection = {
         _id: 1,
         jurisdiction_id: 1,
         display_name: 1,
         avatar: 1,
         
      };

      static fromAccount(data: Account) : Public {
         const result = new Public();
         result._id = data._id;
         result.jurisdiction_id = data.jurisdiction_id;
         result.display_name = data.display_name;
         result.avatar = data.avatar;
         
         return result;
      }
      static copyToAccount(source: Account.Public, target: Account): void {
         //Disallow: target._id = source._id;
         //Disallow: target.jurisdiction_id = source.jurisdiction_id;
         target.display_name = source.display_name;
         target.avatar = source.avatar;
         
      }

      _id: string;
      jurisdiction_id: string;
      display_name?: string;
      avatar?: MediaInfo;
      
   }
   
   export class Connection
   {
      static Projection = {
         _id: 1,
         jurisdiction_id: 1,
         display_name: 1,
         avatar: 1,
         
      };

      static fromAccount(data: Account) : Connection {
         const result = new Connection();
         result._id = data._id;
         result.jurisdiction_id = data.jurisdiction_id;
         result.display_name = data.display_name;
         result.avatar = data.avatar;
         
         return result;
      }
      static copyToAccount(source: Account.Connection, target: Account): void {
         //Disallow: target._id = source._id;
         //Disallow: target.jurisdiction_id = source.jurisdiction_id;
         target.display_name = source.display_name;
         target.avatar = source.avatar;
         
      }

      _id: string;
      jurisdiction_id: string;
      display_name?: string;
      avatar?: MediaInfo;
      
   }
   
   export class Self
   {
      static Projection = {
         _id: 1,
         email: 1,
         joined_utc: 1,
         display_name: 1,
         roles: 1,
         account_status: 1,
         avatar: 1,
         jurisdiction_id: 1,
         auth_provider: 1,
         token: 1,
         impersonated: 1,
         
      };

      static fromAccount(data: Account) : Self {
         const result = new Self();
         result._id = data._id;
         result.email = data.email;
         result.joined_utc = data.joined_utc;
         result.display_name = data.display_name;
         result.roles = data.roles;
         result.account_status = data.account_status;
         result.avatar = data.avatar;
         result.jurisdiction_id = data.jurisdiction_id;
         result.auth_provider = data.auth_provider;
         
         return result;
      }
      static copyToAccount(source: Account.Self, target: Account): void {
         //Disallow: target._id = source._id;
         target.email = source.email;
         target.joined_utc = source.joined_utc;
         target.display_name = source.display_name;
         target.roles = source.roles;
         target.account_status = source.account_status;
         target.avatar = source.avatar;
         //Disallow: target.jurisdiction_id = source.jurisdiction_id;
         target.auth_provider = source.auth_provider;
         
      }

      _id: string;
      email: string;
      joined_utc: Date;
      display_name?: string;
      roles?: string[];
      account_status: AccountStatus;
      avatar?: MediaInfo;
      jurisdiction_id: string;
      auth_provider: string;
      
      /**
       * Manually Hydrated
       */
      token: string
      /**
       * Manually Hydrated
       */
      impersonated: boolean
   }
   
   export class Identity
   {
      static Projection = {
         _id: 1,
         auth_identifier: 1,
         
      };

      static fromAccount(data: Account) : Identity {
         const result = new Identity();
         result._id = data._id;
         result.auth_identifier = data.auth_identifier;
         
         return result;
      }
      static copyToAccount(source: Account.Identity, target: Account): void {
         //Disallow: target._id = source._id;
         target.auth_identifier = source.auth_identifier;
         
      }

      _id: string;
      auth_identifier: string;
      
   }
   
}