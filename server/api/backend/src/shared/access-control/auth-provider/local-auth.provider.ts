import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { StencilJWTPayload } from 'src/shared/types/auth.types';
import { IAuthProvider } from './auth-provider.interface';

/**
 * Development auth provider — no external service required.
 *
 * Token verification: standard HS256 JWT signed with AUTH_SECRET
 * (falls back to 'dev-secret' when the env var is absent).
 *
 * All mutating operations (setClaims, revokeUser, reEnableUser) are no-ops;
 * the application still works correctly because AuthGuard falls back to the
 * GlobalAccount database lookup when custom claims are absent.
 *
 * mintToken() is called only by the dev-token endpoint and is never exposed
 * in production (where LocalAuthProvider is never instantiated).
 */
@Injectable()
export class LocalAuthProvider implements IAuthProvider {
   private readonly logger = new Logger(LocalAuthProvider.name);
   private readonly secret: Uint8Array;

   constructor() {
      const raw = process.env.AUTH_SECRET ?? 'dev-secret';
      this.secret = new TextEncoder().encode(raw);
   }

   async verifyToken(token: string): Promise<StencilJWTPayload> {
      try {
         const { payload } = await jwtVerify(token, this.secret, { algorithms: ['HS256'] });

         if (!payload.sub) {
            throw new UnauthorizedException('Token missing sub claim');
         }

         return {
            sub: payload.sub,
            email: payload['email'] as string | undefined,
            email_verified: payload['email_verified'] as boolean | undefined,
            name: payload['name'] as string | undefined,
            picture: payload['picture'] as string | undefined,
            jurisdiction_id: payload['jurisdiction_id'] as string | undefined,
            account_id: payload['account_id'] as string | undefined,
            language_code: payload['language_code'] as string | undefined,
            auth_provider: 'local',
         };
      } catch (error) {
         if (error instanceof UnauthorizedException) {
            throw error;
         }
         throw new UnauthorizedException('Invalid or expired token');
      }
   }

   async setClaims(uid: string, claims: Record<string, unknown>): Promise<boolean> {
      this.logger.debug(`[Local] setClaims no-op for ${uid.slice(0, 8)}***: ${Object.keys(claims).join(', ')}`);
      return true;
   }

   async revokeUser(uid: string): Promise<void> {
      this.logger.debug(`[Local] revokeUser no-op for ${uid.slice(0, 8)}***`);
   }

   async reEnableUser(uid: string): Promise<void> {
      this.logger.debug(`[Local] reEnableUser no-op for ${uid.slice(0, 8)}***`);
   }

   /**
    * Mint a short-lived HS256 JWT for development use.
    * Only called by the dev-token endpoint — never used in production.
    */
   async mintToken(sub: string, email?: string): Promise<string> {
      return new SignJWT({ sub, email, auth_provider: 'local' })
         .setProtectedHeader({ alg: 'HS256' })
         .setIssuedAt()
         .setExpirationTime('1d')
         .sign(this.secret);
   }
}
