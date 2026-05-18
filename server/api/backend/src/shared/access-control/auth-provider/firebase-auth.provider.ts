import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigResolver } from 'src/config/config.resolver';
import { ConfigTemplates } from 'src/config/config.templates';
import { StencilJWTPayload } from 'src/shared/types/auth.types';
import { IAuthProvider } from './auth-provider.interface';

@Injectable()
export class FirebaseAuthProvider implements IAuthProvider, OnModuleInit {
   private readonly logger = new Logger(FirebaseAuthProvider.name);

   constructor(private readonly configResolver: ConfigResolver) {}

   async onModuleInit(): Promise<void> {
      const projectId = await this.configResolver.getValue(ConfigTemplates.FirebaseProjectId());
      const privateKey = await this.configResolver.getValue(ConfigTemplates.FirebasePrivateKey());
      const clientEmail = await this.configResolver.getValue(ConfigTemplates.FirebaseClientEmail());

      if (!projectId || !privateKey || !clientEmail) {
         throw new Error(
            'Firebase configuration is incomplete. Ensure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL are set.',
         );
      }

      if (!admin.apps.length) {
         admin.initializeApp({
            credential: admin.credential.cert({
               projectId,
               privateKey: privateKey.replace(/\\n/g, '\n'),
               clientEmail,
            }),
         });
      }

      this.logger.log('Firebase Admin initialized');
   }

   // ---------------------------------------------------------------------------
   // IAuthProvider — token verification
   // ---------------------------------------------------------------------------

   async verifyToken(token: string): Promise<StencilJWTPayload> {
      try {
         const decoded = await admin.auth().verifyIdToken(token);
         return {
            sub: decoded.uid,
            email: decoded.email,
            email_verified: decoded.email_verified,
            name: decoded.name,
            picture: decoded.picture,
            jurisdiction_id: decoded.jurisdiction_id as string | undefined,
            account_id: decoded.account_id as string | undefined,
            language_code: decoded.language_code as string | undefined,
            auth_provider: decoded.firebase?.sign_in_provider as string | undefined,
         };
      } catch (error) {
         const message = error instanceof Error ? error.message : String(error);
         this.logger.error(`Token verification failed: ${message}`);
         throw new UnauthorizedException('Invalid or expired token');
      }
   }

   // ---------------------------------------------------------------------------
   // IAuthProvider — claim / user management
   // ---------------------------------------------------------------------------

   async setClaims(uid: string, claims: Record<string, unknown>): Promise<boolean> {
      try {
         const user = await admin.auth().getUser(uid);
         const existing = user.customClaims ?? {};
         const updated = { ...existing };
         let changed = false;

         for (const [key, value] of Object.entries(claims)) {
            if (existing[key] !== value) {
               updated[key] = value;
               changed = true;
            }
         }

         if (!changed) {
            return true;
         }

         await admin.auth().setCustomUserClaims(uid, updated);
         this.logger.log(`Updated claims for user ${uid.slice(0, 8)}***: ${Object.keys(claims).join(', ')}`);
         return true;
      } catch (error) {
         this.logger.error(`Failed to set claims for user ${uid.slice(0, 8)}***: ${error}`);
         return false;
      }
   }

   async revokeUser(uid: string): Promise<void> {
      try {
         await admin.auth().updateUser(uid, { disabled: true });
         await admin.auth().revokeRefreshTokens(uid);
         this.logger.log(`Disabled and revoked tokens for user ${uid.slice(0, 8)}***`);
      } catch (error) {
         this.logger.error(`Failed to revoke user ${uid.slice(0, 8)}***: ${error}`);
      }
   }

   async reEnableUser(uid: string): Promise<void> {
      try {
         await admin.auth().updateUser(uid, { disabled: false });
         this.logger.log(`Re-enabled user ${uid.slice(0, 8)}***`);
      } catch (error) {
         this.logger.error(`Failed to re-enable user ${uid.slice(0, 8)}***: ${error}`);
      }
   }
}
