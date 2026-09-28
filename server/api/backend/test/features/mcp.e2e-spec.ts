import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client } from '@modelcontextprotocol/client';
import { randomUUID } from 'crypto';
import { AddressInfo } from 'net';
import { ConfigResolver } from 'src/config/config.resolver';
import { Account } from 'src/entities/account/account.model';
import { AccountStatus } from 'src/entities/enums/accountstatus';
import { EntityRegistry } from 'src/entities/entity.registry';
import { CloudStorageHandler } from 'src/features/platform/storage';
import { ProfileController } from 'src/features/user/profile/profile.controller';
import { AuthGuard } from 'src/shared/access-control/auth.guard';
import { AccountResolution, AccountResolutionResult, AccountResolver } from 'src/shared/access-control/account-resolver.service';
import { RateLimitService } from 'src/shared/access-control/rate-limit.service';
import { StencilRequest } from 'src/shared/types/auth.types';
import { ItemResult } from 'src/shared/types/data/item-result';
import { DateTransformInterceptor } from 'src/shared/interceptors/date-transform.interceptor';
import { McpConfig } from 'src/shared/mcp/mcp.config';
import { McpController } from 'src/shared/mcp/mcp.controller';
import { McpDispatcher } from 'src/shared/mcp/mcp.dispatcher';
import { McpIdentityKeys, McpIdentityVerifier } from 'src/shared/mcp/mcp-identity.verifier';
import { McpReplayStore } from 'src/shared/mcp/mcp-replay.store';
import { McpServerHandler } from 'src/shared/mcp/mcp.server';
import { AssertionOverrides, MCP_TEST_ENV, MCP_TEST_GATEWAY_TOKEN, TestForge } from '../setup/mcp-test-identity';

const NAME_TOOL = 'profile_update_display_name';
const AVATAR_TOOL = 'profile_update_avatar';
const STAFF = 'staff.member@example.test';
const REMOTE_STAFF = 'remote.staff@example.test';

const CONFIG: Record<string, string> = { ...MCP_TEST_ENV, FEDERATION_JURISDICTION: 'TE,SHARED' };

function testAccount(email: string, jurisdiction_id: string): Account {
   return new Account({
      _id: randomUUID(),
      jurisdiction_id,
      email,
      auth_identifier: email,
      auth_provider: 'forge',
      display_name: 'Staff Member',
      joined_utc: new Date('2026-01-01T00:00:00Z'),
      account_status: AccountStatus.enabled,
   });
}

/**
 * In-memory stand-in for the Mongo-backed account store: STAFF is homed here, REMOTE_STAFF in
 * another region. Perspective updates write through to the stored instance, as the real manager does.
 */
const accounts = new Map<string, Account>([
   [STAFF, testAccount(STAFF, 'TE')],
   [REMOTE_STAFF, testAccount(REMOTE_STAFF, 'EU')],
]);

const accountResolver = {
   resolveLive: async (auth_identifier: string): Promise<AccountResolutionResult> => {
      const account = accounts.get(auth_identifier);
      return account ? { resolution: AccountResolution.resolved, account } : { resolution: AccountResolution.unbound };
   },
};

const entityRegistry = {
   accountManager: { updateInfoPerspective: async (perspective: Account.InfoPerspective) => perspective.getActual() },
   jurisdictionAssetManager: { getById: async () => undefined },
};

/** Replaces AuthGuard for the HTTP path: attaches the same caller shape AuthGuard leaves on the request. */
class StaffAuthGuard implements CanActivate {
   canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<StencilRequest>();
      request.auth = { payload: { sub: STAFF, email: STAFF }, token: 'http-token' };
      request.account = accounts.get(STAFF)!.toSelf();
      return true;
   }
}

/**
 * The MCP endpoint in isolation: real controller, SDK handler, dispatcher, verifier, replay store,
 * rate limiter and ProfileController; only persistence and config are stubbed. The full-stack
 * variant (real accounts in Mongo) is mcp-stack.e2e-spec.ts.
 */
describe('MCP endpoint (e2e)', () => {
   let app: INestApplication;
   let baseUrl: string;
   let endpoint: URL;
   let forge: TestForge;

   const mint = (overrides: AssertionOverrides = {}) => forge.mintAssertion(STAFF, NAME_TOOL, overrides);

   beforeAll(async () => {
      forge = await TestForge.create();
      const moduleRef = await Test.createTestingModule({
         controllers: [McpController, ProfileController],
         providers: [
            { provide: ConfigResolver, useValue: { getValue: async (key: string) => CONFIG[key] } },
            { provide: AccountResolver, useValue: accountResolver },
            { provide: EntityRegistry, useValue: entityRegistry },
            { provide: CloudStorageHandler, useValue: {} },
            { provide: McpIdentityKeys, useValue: forge.keys },
            RateLimitService,
            McpConfig,
            McpReplayStore,
            McpIdentityVerifier,
            McpDispatcher,
            McpServerHandler,
         ],
      })
         .overrideGuard(AuthGuard)
         .useClass(StaffAuthGuard)
         .compile();
      app = moduleRef.createNestApplication();
      app.setGlobalPrefix('api');
      app.useGlobalInterceptors(new DateTransformInterceptor());
      await app.listen(0, '127.0.0.1');
      const { port } = app.getHttpServer().address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${port}`;
      endpoint = new URL(`${baseUrl}/api/mcp`);
   });

   afterAll(async () => {
      await app?.close();
   });

   describe('gateway credential and transport checks', () => {
      const initialize = {
         jsonrpc: '2.0',
         id: 1,
         method: 'initialize',
         params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'raw', version: '0' } },
      };

      async function post(headers: Record<string, string>): Promise<Response> {
         return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...headers },
            body: JSON.stringify(initialize),
         });
      }

      it('rejects a request without the gateway credential', async () => {
         const res = await post({});
         expect(res.status).toBe(401);
         expect(res.headers.get('www-authenticate')).toContain('Bearer');
      });

      it('rejects a wrong gateway credential', async () => {
         const res = await post({ Authorization: 'Bearer not-the-gateway-token-000000000000000000' });
         expect(res.status).toBe(401);
      });

      it('rejects a signed user token in place of the gateway credential', async () => {
         const res = await post({ Authorization: `Bearer ${await mint()}` });
         expect(res.status).toBe(401);
      });

      it('rejects a disallowed Origin', async () => {
         const res = await post({ Authorization: `Bearer ${MCP_TEST_GATEWAY_TOKEN}`, Origin: 'https://evil.example' });
         expect(res.status).toBe(403);
      });

      it('rejects a non-JSON body', async () => {
         const res = await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${MCP_TEST_GATEWAY_TOKEN}`, 'Content-Type': 'text/plain' },
            body: 'hello',
         });
         expect(res.status).toBe(415);
      });

      it('accepts initialize with the gateway credential', async () => {
         const res = await post({ Authorization: `Bearer ${MCP_TEST_GATEWAY_TOKEN}` });
         expect(res.status).toBe(200);
      });
   });

   describe('tools/list', () => {
      it.each([false, true])('lists generated tools in deterministic order (modern=%s)', async modern => {
         const client = await forge.connect(endpoint, modern);
         const { tools } = await client.listTools();
         expect(tools.map(t => t.name)).toEqual([AVATAR_TOOL, NAME_TOOL]);
         const nameTool = tools.find(t => t.name === NAME_TOOL)!;
         expect(nameTool.inputSchema).toMatchObject({ type: 'object', additionalProperties: false, required: ['display_name'] });
         expect(nameTool.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false });
         expect(nameTool.outputSchema?.type).toBe('object');
         await client.close();
      });

      it('matches the published tool contract (review any snapshot change as an API change)', async () => {
         const client = await forge.connect(endpoint);
         const { tools } = await client.listTools();
         expect(tools).toMatchSnapshot();
         await client.close();
      });
   });

   describe('tools/call', () => {
      let client: Client;

      beforeAll(async () => {
         client = await forge.connect(endpoint);
      });

      afterAll(async () => {
         await client?.close();
      });

      async function call(args: Record<string, unknown>, tool = NAME_TOOL) {
         return client.callTool({ name: tool, arguments: args });
      }

      it('rejects a call with no identity assertion', async () => {
         await expect(call({ display_name: 'Ada' })).rejects.toMatchObject({ code: -32001 });
      });

      it.each<[string, AssertionOverrides]>([
         ['an app id_token type', { typ: 'JWT' }],
         ['another audience', { aud: 'https://other.test/api/mcp' }],
         ['another issuer', { iss: 'https://evil.test/oauth2' }],
         ['an assertion minted for another tool', { tool: AVATAR_TOOL }],
         ['an expired assertion', { issuedAgoSeconds: 400, ttlSeconds: 60 }],
         ['an over-long lifetime', { issuedAgoSeconds: 360, ttlSeconds: 3600 }],
         ['a caller with no account', { sub: 'nobody@example.test' }],
         ['a caller homed on another regional instance', { sub: REMOTE_STAFF }],
      ])('rejects %s', async (_label, overrides) => {
         await expect(call({ display_name: 'Ada', _forge_identity: await mint(overrides) })).rejects.toMatchObject({ code: -32001 });
      });

      it('rejects a replayed assertion', async () => {
         const assertion = await mint();
         await call({ display_name: 'Ada', _forge_identity: assertion });
         await expect(call({ display_name: 'Ada', _forge_identity: assertion })).rejects.toMatchObject({ code: -32001 });
      });

      it('rejects an unknown tool as a protocol error', async () => {
         const assertion = await mint({ tool: 'profile_delete_everything' });
         await expect(call({ _forge_identity: assertion }, 'profile_delete_everything')).rejects.toMatchObject({ code: -32602 });
      });

      it('returns a tool error for arguments the request model does not allow', async () => {
         const result = await call({ display_name: 'Ada', jurisdiction_id: 'XX', _forge_identity: await mint() });
         expect(result.isError).toBe(true);
         expect(JSON.stringify(result.content)).toContain('Unexpected property: jurisdiction_id');
      });

      it('runs the controller operation for the verified caller and returns Account.Self', async () => {
         const result = await call({ display_name: 'Ada Lovelace', _forge_identity: await mint() });
         expect(result.isError).toBeFalsy();
         const item = result.structuredContent as Record<string, unknown>;
         expect(item.display_name).toBe('Ada Lovelace');
         expect(item.email).toBe(STAFF);
         expect(item.jurisdiction_id).toBe('TE');
         expect(item.joined_utc).toBe('2026-01-01T00:00:00.000Z');
         expect(Object.keys(item).every(key => key in Account.Self.Projection)).toBe(true);
         expect(item).not.toHaveProperty('auth_identifier');
         expect(item).not.toHaveProperty('token');
         expect(accounts.get(STAFF)!.display_name).toBe('Ada Lovelace');
      });

      it('maps a controller 404 to a tool error the model can act on', async () => {
         const result = await call(
            { asset_id: randomUUID(), _forge_identity: await mint({ tool: AVATAR_TOOL }) },
            AVATAR_TOOL,
         );
         expect(result.isError).toBe(true);
         expect(JSON.stringify(result.content)).toContain('Not Found');
      });
   });

   describe('HTTP path to the same operation', () => {
      it('serves POST /api/v1/profile/name through the renamed controller method', async () => {
         const res = await fetch(`${baseUrl}/api/v1/profile/name`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_name: 'Grace Hopper' }),
         });
         expect(res.status).toBe(200);
         const body = (await res.json()) as ItemResult<Account.Self>;
         expect(body.success).toBe(true);
         expect(body.item?.display_name).toBe('Grace Hopper');
      });

      it('still sanitizes the HTTP body', async () => {
         const res = await fetch(`${baseUrl}/api/v1/profile/name`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_name: 'x', roles: ['admin'] }),
         });
         expect(res.status).toBe(400);
      });
   });
});
