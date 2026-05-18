import { StencilJWTPayload } from 'src/shared/types/auth.types';

/**
 * Abstraction over the identity provider.
 *
 * The active implementation is determined at startup:
 *   - FIREBASE_PROJECT_ID set  →  FirebaseAuthProvider
 *   - FIREBASE_PROJECT_ID absent →  LocalAuthProvider (dev / in-memory mode)
 *
 * Consumers inject via @Inject(AUTH_PROVIDER).
 */
export interface IAuthProvider {
   /**
    * Verify a Bearer token and return the decoded payload.
    * Throws an UnauthorizedException-compatible error on failure.
    */
   verifyToken(token: string): Promise<StencilJWTPayload>;

   /**
    * Merge the supplied claims into the user's token profile.
    * Keys already on the token that are not in `claims` are preserved.
    * Returns true on success, false on soft failure.
    * No-ops (returning true) are acceptable for providers that do not
    * support server-side claim propagation.
    */
   setClaims(uid: string, claims: Record<string, unknown>): Promise<boolean>;

   /**
    * Revoke all active sessions for the user and mark them as disabled
    * in the identity provider. No-op for providers that do not support this.
    */
   revokeUser(uid: string): Promise<void>;

   /**
    * Re-enable a previously revoked/disabled user.
    * No-op for providers that do not support this.
    */
   reEnableUser(uid: string): Promise<void>;
}

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');
