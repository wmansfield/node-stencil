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
         const res = await http
            .post('/api/v1/auth/self')
            .send({});

         expect(res.status).toBe(200);
         expect(res.body.item.display_name).toBe('Integration Test User');
      });

      it('should keep the current name when an empty name is sent', async () => {
         const res = await http
            .post('/api/v1/profile/name')
            .send({ display_name: '   ' });

         expect(res.status).toBe(200);
         expect(res.body.item.display_name).toBe('Integration Test User');
      });

      it('should reject properties the request model does not allow', async () => {
         const res = await http
            .post('/api/v1/profile/name')
            .send({ display_name: 'x', roles: ['admin'] });

         expect(res.status).toBe(400);
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

      it('should return 4xx for unauthenticated avatar request', async () => {
         const supertest = require('supertest');
         const res = await supertest(ctx.app.getHttpServer())
            .post('/api/v1/profile/avatar')
            .send({ asset_id: '00000000-0000-0000-0000-000000000000' });

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });
   });
});
