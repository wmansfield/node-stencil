import { Client } from '@modelcontextprotocol/client';
import { AddressInfo } from 'net';
import { createTestApp, teardownTestApp, TestContext } from '../setup/test-app';
import { authedAgent, ensureTestUser, seedJurisdiction, TEST_USER, TEST_USER_2 } from '../setup/test-helpers';
import { MCP_TEST_ENV, TestForge } from '../setup/mcp-test-identity';
import { McpIdentityKeys } from 'src/shared/mcp/mcp-identity.verifier';

const NAME_TOOL = 'profile_update_display_name';

/**
 * MCP over the full test stack: real McpModule, real AccountResolver and managers, in-memory Mongo.
 * Proves a tool call acts as the asserted user on that user's own record.
 */
describe('MCP over the full stack (e2e)', () => {
   let ctx: TestContext;
   let forge: TestForge;
   let client: Client;

   beforeAll(async () => {
      Object.assign(process.env, MCP_TEST_ENV);
      forge = await TestForge.create();
      ctx = await createTestApp({ configure: builder => builder.overrideProvider(McpIdentityKeys).useValue(forge.keys) });
      await seedJurisdiction(ctx.mongoProvider);
      await ensureTestUser(ctx.app, ctx.mongoProvider);
      await ensureTestUser(ctx.app, ctx.mongoProvider, TEST_USER_2);
      await ctx.app.listen(0, '127.0.0.1');
      const { port } = ctx.app.getHttpServer().address() as AddressInfo;
      client = await forge.connect(new URL(`http://127.0.0.1:${port}/api/mcp`));
   }, 120_000);

   afterAll(async () => {
      await client?.close();
      if (ctx) {
         await teardownTestApp(ctx);
      }
      for (const key of Object.keys(MCP_TEST_ENV)) {
         delete process.env[key];
      }
   });

   it('updates the asserted user and only that user', async () => {
      const result = await client.callTool({
         name: NAME_TOOL,
         arguments: { display_name: 'Named Over MCP', _forge_identity: await forge.mintAssertion(TEST_USER.sub, NAME_TOOL) },
      });
      expect(result.isError).toBeFalsy();
      expect((result.structuredContent as { display_name?: string }).display_name).toBe('Named Over MCP');

      const self = await authedAgent(ctx.app).post('/api/v1/auth/self').send({});
      expect(self.status).toBe(200);
      expect(self.body.item.display_name).toBe('Named Over MCP');

      const other = await authedAgent(ctx.app, TEST_USER_2).post('/api/v1/auth/self').send({});
      expect(other.body.item.display_name).toBe(TEST_USER_2.displayName);
   });

   it('rejects an identity with no account', async () => {
      const assertion = await forge.mintAssertion('never-registered', NAME_TOOL);
      await expect(
         client.callTool({ name: NAME_TOOL, arguments: { display_name: 'x', _forge_identity: assertion } }),
      ).rejects.toMatchObject({ code: -32001 });
   });
});
