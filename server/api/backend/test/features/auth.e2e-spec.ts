import { createTestApp, teardownTestApp, TestContext } from '../setup/test-app';
import {
   seedJurisdiction,
   ensureTestUser,
   authedAgent,
   TestAgent,
   TEST_JURISDICTION,
   TEST_USER,
} from '../setup/test-helpers';
import { expectStrictItemShape, NestedTypeMap } from '../setup/response-shape';
import { Account } from 'src/entities/account/account.model';
import { v4 as uuidv4 } from 'uuid';

// Ensure validators are registered for shape checking
import 'src/entities/account/account.sanitized.validators';
import 'src/entities/mediainfo/mediainfo.sanitized.validators';

// Nested type imports for recursive shape checking
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';

const ACCOUNT_SELF_NESTED: NestedTypeMap = {
   avatar: MediaInfo,
};

describe('Auth Feature (e2e)', () => {
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

      it('should auto-create a free entitlement on /self', async () => {
         const res = await http
            .post('/api/v1/auth/self')
            .send({});

         expect(res.status).toBe(200);
         expect(res.body.item.entitlement).toBeDefined();
         expect(res.body.item.entitlement.access_tier).toBe('free');
      });

      it('should return current_usage with usage structure on /self', async () => {
         const res = await http
            .post('/api/v1/auth/self')
            .send({});

         expect(res.status).toBe(200);
         const usage = res.body.item.current_usage;
         expect(usage).toBeDefined();
         expect(usage.as_of_utc).toBeDefined();
      });

      it('should register with handle, display name, and keys', async () => {
         // Fresh accounts have trust_level = undefined, so initial registration
         // must include keys (replace_keys: true) to satisfy the trust level transition.
         // key_id must be valid UUIDs (validated by accountkey.manager.base).
         const res = await http
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'E2E Tester',
               handle: 'e2etester',
               replace_keys: true,
               primary_key: { public_key: 'test-pk-001', key_id: uuidv4() },
               secondary_key: { public_key: 'test-sk-001', key_id: uuidv4() },
            });

         expect(res.status).toBe(200);
         expect(res.body.success).toBe(true);
         expect(res.body.item).toBeDefined();
         expect(res.body.item.display_name).toBe('E2E Tester');
      });

      it('should persist handle on subsequent /self calls', async () => {
         const res = await http
            .post('/api/v1/auth/self')
            .send({});

         expect(res.status).toBe(200);
         expect(res.body.item.handle).toBeDefined();
         expect(res.body.item.handle.clean).toBe('e2etester');
      });

      it('should include entitlement and current_usage on /register response', async () => {
         // Handle already claimed; trust_level already 0; no key change needed
         const res = await http
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'E2E Tester',
               handle: 'e2etester',
               replace_keys: false,
            });

         expect(res.status).toBe(200);
         expect(res.body.item.entitlement).toBeDefined();
         expect(res.body.item.entitlement.access_tier).toBe('free');
         expect(res.body.item.current_usage).toBeDefined();
         expect(res.body.item.current_usage.as_of_utc).toBeDefined();
      });

      // NOTE: UIException uses HttpStatus.ACCEPTED (202) for user-facing validation errors

      it('should reject replace_keys without primary_key', async () => {
         const res = await http
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'E2E Tester',
               handle: 'e2etester',
               replace_keys: true,
               // primary_key intentionally omitted
            });

         // UIException returns 202 with a user-facing error message
         expect(res.status).toBe(202);
      });

      it('should reject custodian trust without secondary keys', async () => {
         const res = await http
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'E2E Tester',
               handle: 'e2etester',
               replace_keys: true,
               primary_key: { public_key: 'pk-test', key_id: uuidv4() },
               // secondary_key intentionally omitted
            });

         expect(res.status).toBe(202);
      });

      it('should reject custodian trust without custodian transport', async () => {
         const res = await http
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'E2E Tester',
               handle: 'e2etester',
               replace_keys: true,
               primary_key: { public_key: 'pk-test', key_id: uuidv4() },
               secondary_key: { public_key: 'sk-test', key_id: uuidv4() },
               // secondary_custodian intentionally omitted
            });

         expect(res.status).toBe(202);
      });
   });

   // ==================================================================
   // 2. Response shape — data leakage checks
   // ==================================================================

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
         // Handle already claimed; trust_level already 0; no key change needed
         const res = await http
            .post('/api/v1/auth/register')
            .send({
               jurisdiction: TEST_JURISDICTION,
               auth_token: 'test-token',
               display_name: 'Shape Check',
               handle: 'e2etester',
               replace_keys: false,
            });

         expect(res.status).toBe(200);
         expect(res.body.item).toBeDefined();

         expectStrictItemShape(res.body, Account.Self, ACCOUNT_SELF_NESTED);
      });
   });

   // ==================================================================
   // 3. Auth boundary
   // ==================================================================

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
               handle: 'hacker',
               replace_keys: false,
            });

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });
   });
});
