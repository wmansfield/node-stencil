import { Request } from 'express';
import { Account } from 'src/entities/account/account.model';

export interface StencilJWTPayload {
   sub: string;
   iss?: string;
   aud?: string | string[];
   exp?: number;
   iat?: number;
   email?: string;
   email_verified?: boolean;
   name?: string;
   nickname?: string;
   picture?: string;
   /** Jurisdiction claim — set during registration, carried in subsequent tokens */
   jurisdiction_id?: string;
   /** Account ID claim — set during registration, carried in subsequent tokens */
   account_id?: string;
   /** Roles claim — synced from account on permission updates */
   roles?: string[];
   /** Language preference claim */
   language_code?: string;
   /** Auth provider identifier (e.g. 'password', 'google.com', 'local') */
   auth_provider?: string;
}

export interface StencilAuthResult {
   payload: StencilJWTPayload;
   token: string;
}

export interface StencilRequest extends Request {
   auth?: StencilAuthResult;
   account_resolved?: Date;
   account?: Account.Self;
   jurisdiction_id?: string;
}
