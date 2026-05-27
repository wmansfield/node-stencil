import { createTestApp, teardownTestApp, TestContext } from '../setup/test-app';
import {
   seedJurisdiction,
   ensureTestUser,
   authedAgent,
   TestAgent,
   TEST_JURISDICTION,
} from '../setup/test-helpers';
import { expectStrictItemShape, NestedTypeMap } from '../setup/response-shape';
import { Account } from 'src/entities/account/account.model';

import 'src/entities/account/account.sanitized.validators';
import 'src/entities/mediainfo/mediainfo.sanitized.validators';

import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';

const ACCOUNT_SELF_NESTED: NestedTypeMap = {
   avatar: MediaInfo,
};

describe('Auth Feature (e2e)', () => {
   let ctx: TestContext;
   let http: TestAgent;

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

   describe('lifecycle', () => {
      it('should return Account.Self from /self', async () => {
         const res = await http
            .post('/api/v1/auth/self')
            .send({});

         expect(res.status).toBe(200);
         expect(res.body.success).toBe(true);
         expect(res.body.item).toBeDefined();
         expect(res.body.item._id).toBeDefined();
         expect(res.body.item.jurisdiction_id).toBe(TEST_JURISDICTION);
      });

      it('should register with display name', async () => {
         const res = await http
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'E2E Tester',
            });

         expect(res.status).toBe(200);
         expect(res.body.success).toBe(true);
         expect(res.body.item).toBeDefined();
         expect(res.body.item.display_name).toBe('E2E Tester');
      });

      it('should persist display name on subsequent /self calls', async () => {
         const res = await http
            .post('/api/v1/auth/self')
            .send({});

         expect(res.status).toBe(200);
         expect(res.body.item.display_name).toBe('E2E Tester');
      });
   });

   describe('response shape', () => {
      it('/self response should return only Account.Self fields (no leakage)', async () => {
         const res = await http
            .post('/api/v1/auth/self')
            .send({});

         expect(res.status).toBe(200);
         expect(res.body.item).toBeDefined();

         expectStrictItemShape(res.body, Account.Self, ACCOUNT_SELF_NESTED);
      });

      it('/register response should return only Account.Self fields (no leakage)', async () => {
         const res = await http
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'Shape Check',
            });

         expect(res.status).toBe(200);
         expect(res.body.item).toBeDefined();

         expectStrictItemShape(res.body, Account.Self, ACCOUNT_SELF_NESTED);
      });
   });

   describe('auth', () => {
      it('should return 4xx for unauthenticated /self request', async () => {
         const supertest = require('supertest');
         const res = await supertest(ctx.app.getHttpServer())
            .post('/api/v1/auth/self')
            .send({});

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });

      it('should return 4xx for unauthenticated /register request', async () => {
         const supertest = require('supertest');
         const res = await supertest(ctx.app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'Hacker',
            });

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });
   });
});
