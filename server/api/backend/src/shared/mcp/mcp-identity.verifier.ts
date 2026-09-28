import { Injectable, Logger } from '@nestjs/common';
import { createRemoteJWKSet, errors, jwtVerify, JWTVerifyGetKey } from 'jose';
import { McpConfig } from './mcp.config';
import { McpReplayStore } from './mcp-replay.store';

/** Reserved tool argument carrying Forge's per-call identity assertion. */
export const MCP_IDENTITY_ARGUMENT = '_forge_identity';

/** JOSE `typ` Forge sets on upstream identity assertions; app id_tokens use `JWT`. */
export const MCP_IDENTITY_TOKEN_TYP = 'forge-upstream+jwt';

const CLOCK_TOLERANCE_SECONDS = 30;
const MAX_TOKEN_AGE_SECONDS = 300;

/** Source of the keys that sign identity assertions. Overridden in tests. */
export abstract class McpIdentityKeys {
   abstract resolver(): JWTVerifyGetKey;
}

@Injectable()
export class RemoteMcpIdentityKeys extends McpIdentityKeys {
   private jwks: JWTVerifyGetKey | null = null;

   constructor(private readonly config: McpConfig) {
      super();
   }

   resolver(): JWTVerifyGetKey {
      if (!this.jwks) {
         this.jwks = createRemoteJWKSet(new URL(`${this.config.issuer}/jwks`));
      }
      return this.jwks;
   }
}

export enum McpIdentityFailure {
   missing = 'missing',
   invalid = 'invalid',
   expired = 'expired',
   wrong_tool = 'wrong_tool',
   replayed = 'replayed',
}

export class McpIdentityError extends Error {
   constructor(readonly failure: McpIdentityFailure) {
      super(`identity ${failure}`);
   }
}

/** The verified caller of one tool call. */
export interface McpIdentity {
   sub: string;
   email: string;
   actor: string;
   tool: string;
   jti: string;
   request_id?: string;
}

/**
 * Verifies the Forge upstream identity assertion: RS256 signature from the Forge JWKS, exact
 * `typ`, issuer, audience equal to this endpoint's own URL, a short lifetime, the tool it was
 * minted for, and single use. Contract: forge docs/UPSTREAM-IDENTITY.md.
 */
@Injectable()
export class McpIdentityVerifier {
   private readonly logger = new Logger(McpIdentityVerifier.name);

   constructor(
      private readonly config: McpConfig,
      private readonly keys: McpIdentityKeys,
      private readonly replay: McpReplayStore,
   ) {}

   async verify(token: unknown, tool: string): Promise<McpIdentity> {
      if (typeof token !== 'string' || token.length === 0) {
         throw new McpIdentityError(McpIdentityFailure.missing);
      }
      let payload;
      try {
         const verified = await jwtVerify(token, this.keys.resolver(), {
            algorithms: ['RS256'],
            typ: MCP_IDENTITY_TOKEN_TYP,
            issuer: this.config.issuer,
            audience: this.config.resourceUrl,
            clockTolerance: CLOCK_TOLERANCE_SECONDS,
            maxTokenAge: MAX_TOKEN_AGE_SECONDS,
            requiredClaims: ['sub', 'exp', 'iat', 'nbf', 'jti'],
         });
         payload = verified.payload;
      } catch (error) {
         if (error instanceof errors.JWTExpired) {
            throw new McpIdentityError(McpIdentityFailure.expired);
         }
         this.logger.warn(`Rejected MCP identity assertion (${error instanceof Error ? error.name : 'unknown'})`);
         throw new McpIdentityError(McpIdentityFailure.invalid);
      }

      const sub = typeof payload.sub === 'string' ? payload.sub.trim().toLowerCase() : '';
      const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : sub;
      const jti = typeof payload.jti === 'string' ? payload.jti : '';
      const actor = readActor(payload.act);
      if (!sub || !jti || !actor || payload.email_verified !== true) {
         throw new McpIdentityError(McpIdentityFailure.invalid);
      }
      if (payload.mcp_tool !== tool) {
         throw new McpIdentityError(McpIdentityFailure.wrong_tool);
      }
      const expiresAtMs = (payload.exp as number) * 1000 + CLOCK_TOLERANCE_SECONDS * 1000;
      if (!(await this.replay.claim(jti, expiresAtMs))) {
         throw new McpIdentityError(McpIdentityFailure.replayed);
      }
      return {
         sub,
         email,
         actor,
         tool,
         jti,
         request_id: typeof payload.forge_rid === 'string' ? payload.forge_rid : undefined,
      };
   }
}

/** RFC 8693 actor claim. */
interface ActorClaim {
   sub?: unknown;
}

function readActor(act: unknown): string {
   if (typeof act !== 'object' || act === null) {
      return '';
   }
   const sub = (act as ActorClaim).sub;
   return typeof sub === 'string' ? sub : '';
}
