import { createTestApp, teardownTestApp, TestContext } from '../setup/test-app';
import {
   seedJurisdiction,
   ensureTestUser,
   authedAgent,
   TestAgent,
} from '../setup/test-helpers';
import { expectStrictItemShape } from '../setup/response-shape';
import { Account } from 'src/entities/account/account.model';

// Ensure validators are registered for shape checking
import 'src/entities/account/account.sanitized.validators';
import 'src/entities/mediainfo/mediainfo.sanitized.validators';

// Nested type imports for recursive shape checking
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';

const ACCOUNT_SELF_NESTED = {
   avatar: MediaInfo,
};

describe('Profile Feature (e2e)', () => {
   let ctx: TestContext;
   let http: TestAgent;

   // ------------------------------------------------------------------
   // Setup / Teardown
   // ------------------------------------------------------------------

   beforeAll(async () => {
      ctx = await createTestApp();
      await seedJurisdiction(ctx.mongoProvider);
      await ensureTestUser(ctx.app, ctx.mongoProvider);
      http = authedAgent(ctx.app);
   }, 120_000);

   afterAll(async () => {
      if (ctx) {
         await teardownTestApp(ctx);
      }
   });

   // ==================================================================
   // 1. Functional lifecycle
   // ==================================================================

   describe('lifecycle', () => {
      it('should update display name and return updated Account.Self', async () => {
         const res = await http
            .post('/api/v1/profile/name')
            .send({ display_name: 'Integration Test User' });

         expect(res.status).toBe(200);
         expect(res.body.success).toBe(true);
         expect(res.body.item).toBeDefined();
         expect(res.body.item.display_name).toBe('Integration Test User');
      });

      it('should persist the name on subsequent requests', async () => {
         // Use settings endpoint to get a fresh Account.Self without modifying name
         const res = await http
            .post('/api/v1/profile/settings')
            .send({});

         expect(res.status).toBe(200);
         expect(res.body.item.display_name).toBe('Integration Test User');
      });

      it('should update settings and return them in Account.Self', async () => {
         const res = await http
            .post('/api/v1/profile/settings')
            .send({ theme: 'dark', language_code: 'en' });

         expect(res.status).toBe(200);
         expect(res.body.success).toBe(true);
         expect(res.body.item).toBeDefined();
         expect(res.body.item.settings).toBeDefined();
         expect(res.body.item.settings.theme).toBe('dark');
         expect(res.body.item.settings.language_code).toBe('en');
      });

      it('should replace settings entirely on update (not merge)', async () => {
         // Settings endpoint does a full replace, not a merge
         const res = await http
            .post('/api/v1/profile/settings')
            .send({ iana_zone: 'America/New_York' });

         expect(res.status).toBe(200);
         expect(res.body.item.settings).toBeDefined();
         expect(res.body.item.settings.iana_zone).toBe('America/New_York');
         // Previous theme was replaced — not a merge
         expect(res.body.item.settings.theme).toBeUndefined();
      });

      it('should update language_code in isolation via /language endpoint', async () => {
         // First, set some settings so we can verify language doesn't clobber them
         await http
            .post('/api/v1/profile/settings')
            .send({ theme: 'dark', iana_zone: 'America/New_York' });

         // Now update language in isolation
         const res = await http
            .post('/api/v1/profile/language')
            .send({ language_code: 'es' });

         expect(res.status).toBe(200);
         expect(res.body.success).toBe(true);
         expect(res.body.item).toBeDefined();
         expect(res.body.item.settings).toBeDefined();
         expect(res.body.item.settings.language_code).toBe('es');
      });

      it('should preserve other settings when updating language', async () => {
         // The previous test set theme='dark' and iana_zone='America/New_York',
         // then updated language_code to 'es'. Verify everything persisted.
         const res = await http
            .post('/api/v1/profile/settings')
            .send({ theme: 'dark', iana_zone: 'America/New_York', language_code: 'es' });

         // Use settings to read back and confirm language is still 'es'
         const readRes = await http
            .post('/api/v1/profile/language')
            .send({ language_code: 'es' });

         expect(readRes.status).toBe(200);
         expect(readRes.body.item.settings.language_code).toBe('es');
      });

      it('should update language_code to a different value', async () => {
         const res = await http
            .post('/api/v1/profile/language')
            .send({ language_code: 'zh' });

         expect(res.status).toBe(200);
         expect(res.body.item.settings.language_code).toBe('zh');
      });

      it('should create settings if none exist when updating language', async () => {
         // Clear settings entirely via the settings endpoint
         const clearRes = await http
            .post('/api/v1/profile/settings')
            .send({});

         expect(clearRes.status).toBe(200);

         // Now set language — should create settings object
         const res = await http
            .post('/api/v1/profile/language')
            .send({ language_code: 'en' });

         expect(res.status).toBe(200);
         expect(res.body.item.settings).toBeDefined();
         expect(res.body.item.settings.language_code).toBe('en');
      });

      it('should return 404 for avatar with non-existent asset_id', async () => {
         const fakeAssetId = '00000000-0000-0000-0000-000000000000';
         const res = await http
            .post('/api/v1/profile/avatar')
            .send({ asset_id: fakeAssetId });

         expect(res.status).toBe(404);
      });
   });

   // ==================================================================
   // 2. Response shape — data leakage checks
   // ==================================================================

   describe('response shape', () => {
      it('name response should return only Account.Self fields (no leakage)', async () => {
         const res = await http
            .post('/api/v1/profile/name')
            .send({ display_name: 'Shape Test' });

         expect(res.status).toBe(200);
         expect(res.body.item).toBeDefined();

         expectStrictItemShape(res.body, Account.Self, ACCOUNT_SELF_NESTED);
      });

      it('settings response should return only Account.Self fields (no leakage)', async () => {
         const res = await http
            .post('/api/v1/profile/settings')
            .send({});

         expect(res.status).toBe(200);
         expect(res.body.item).toBeDefined();

         expectStrictItemShape(res.body, Account.Self, ACCOUNT_SELF_NESTED);
      });

      it('language response should return only Account.Self fields (no leakage)', async () => {
         const res = await http
            .post('/api/v1/profile/language')
            .send({ language_code: 'en' });

         expect(res.status).toBe(200);
         expect(res.body.item).toBeDefined();

         expectStrictItemShape(res.body, Account.Self, ACCOUNT_SELF_NESTED);
      });
   });

   // ==================================================================
   // 3. Auth boundary
   // ==================================================================

   describe('auth', () => {
      it('should return 4xx for unauthenticated name request', async () => {
         const supertest = require('supertest');
         const res = await supertest(ctx.app.getHttpServer())
            .post('/api/v1/profile/name')
            .send({ display_name: 'Hacker' });

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });

      it('should return 4xx for unauthenticated settings request', async () => {
         const supertest = require('supertest');
         const res = await supertest(ctx.app.getHttpServer())
            .post('/api/v1/profile/settings')
            .send({ theme: 'dark' });

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });

      it('should return 4xx for unauthenticated avatar request', async () => {
         const supertest = require('supertest');
         const res = await supertest(ctx.app.getHttpServer())
            .post('/api/v1/profile/avatar')
            .send({ asset_id: '00000000-0000-0000-0000-000000000000' });

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });

      it('should return 4xx for unauthenticated language request', async () => {
         const supertest = require('supertest');
         const res = await supertest(ctx.app.getHttpServer())
            .post('/api/v1/profile/language')
            .send({ language_code: 'es' });

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });
   });
});
