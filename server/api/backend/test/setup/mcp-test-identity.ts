import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createLocalJWKSet, exportJWK, generateKeyPair, JWTVerifyGetKey, KeyLike, SignJWT } from 'jose';
import { randomUUID } from 'crypto';
import { McpIdentityKeys } from 'src/shared/mcp/mcp-identity.verifier';

export const MCP_TEST_RESOURCE_URL = 'https://stencil.test/api/mcp';
export const MCP_TEST_ISSUER = 'https://forge.test/oauth2';
export const MCP_TEST_GATEWAY_TOKEN = 'test-gateway-token-0123456789abcdef0123456789';
const KID = 'forge-test-kid';

/** Env values that enable /api/mcp for the test identity issuer. */
export const MCP_TEST_ENV: Record<string, string> = {
   MCP_RESOURCE_URL: MCP_TEST_RESOURCE_URL,
   MCP_GATEWAY_TOKEN: MCP_TEST_GATEWAY_TOKEN,
   MCP_IDENTITY_ISSUER: MCP_TEST_ISSUER,
};

export interface AssertionOverrides {
   typ?: string;
   iss?: string;
   aud?: string;
   sub?: string;
   tool?: string;
   ttlSeconds?: number;
   issuedAgoSeconds?: number;
}

class LocalIdentityKeys extends McpIdentityKeys {
   constructor(private readonly keys: JWTVerifyGetKey) {
      super();
   }

   resolver(): JWTVerifyGetKey {
      return this.keys;
   }
}

/** Plays Forge: signs upstream identity assertions exactly as the identity_jwt plugin does. */
export class TestForge {
   private constructor(
      private readonly privateKey: KeyLike,
      readonly keys: McpIdentityKeys,
   ) {}

   static async create(): Promise<TestForge> {
      const pair = await generateKeyPair('RS256');
      const jwk = { ...(await exportJWK(pair.publicKey)), kid: KID, alg: 'RS256', use: 'sig' };
      return new TestForge(pair.privateKey, new LocalIdentityKeys(createLocalJWKSet({ keys: [jwk] })));
   }

   async mintAssertion(sub: string, tool: string, overrides: AssertionOverrides = {}): Promise<string> {
      const now = Math.floor(Date.now() / 1000) - (overrides.issuedAgoSeconds ?? 0);
      const subject = overrides.sub ?? sub;
      return new SignJWT({
         email: subject,
         email_verified: true,
         act: { sub: 'forge-gateway' },
         mcp_tool: overrides.tool ?? tool,
         forge_rid: 'rid-test',
      })
         .setProtectedHeader({ alg: 'RS256', typ: overrides.typ ?? 'forge-upstream+jwt', kid: KID })
         .setIssuer(overrides.iss ?? MCP_TEST_ISSUER)
         .setAudience(overrides.aud ?? MCP_TEST_RESOURCE_URL)
         .setSubject(subject)
         .setJti(randomUUID())
         .setIssuedAt(now)
         .setNotBefore(now)
         .setExpirationTime(now + (overrides.ttlSeconds ?? 60))
         .sign(this.privateKey);
   }

   /** An MCP client configured like the Forge gateway (stored bearer credential on every request). */
   async connect(endpoint: URL, modern = false): Promise<Client> {
      const transport = new StreamableHTTPClientTransport(endpoint, {
         requestInit: { headers: { Authorization: `Bearer ${MCP_TEST_GATEWAY_TOKEN}` } },
      });
      const client = new Client(
         { name: 'forge-test', version: '0.0.1' },
         modern ? { versionNegotiation: { mode: { pin: '2026-07-28' } } } : undefined,
      );
      await client.connect(transport);
      return client;
   }
}
