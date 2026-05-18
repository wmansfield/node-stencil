import request = require('supertest');
import { NestExpressApplication } from '@nestjs/platform-express';
import { TestMongoConnectionProvider } from './test-mongo-connection.provider';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TEST_JURISDICTION = 'TE';

export const TEST_USER = {
   sub: 'test-user-001',
   email: 'test-user-001@test.stencil.local',
   displayName: 'Test User',
};

export const TEST_USER_2 = {
   sub: 'test-user-002',
   email: 'test-user-002@test.stencil.local',
   displayName: 'Test User 2',
};

// ---------------------------------------------------------------------------
// Agent type
// ---------------------------------------------------------------------------

export type TestAgent = {
   get: (url: string) => request.Test;
   post: (url: string) => request.Test;
   put: (url: string) => request.Test;
   patch: (url: string) => request.Test;
   delete: (url: string) => request.Test;
};

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

/**
 * Seeds the Jurisdiction record in the SHARED database.
 * Jurisdictions are administrative reference data with no create API,
 * so this is the one entity we insert via the raw Mongoose model.
 */
export async function seedJurisdiction(mongoProvider: TestMongoConnectionProvider): Promise<void> {
   const sharedConn = await mongoProvider.getTenantConnection('SHARED');
   const JurisdictionModel = sharedConn.model('Jurisdiction');

   const exists = await JurisdictionModel.findById(TEST_JURISDICTION).lean().exec();
   if (!exists) {
      await JurisdictionModel.create({
         _id: TEST_JURISDICTION,
         jurisdiction_id: TEST_JURISDICTION,
         created_utc: new Date(),
         updated_utc: new Date(),
         searchable: TEST_JURISDICTION.toLowerCase(),
      });
   }
}

/**
 * Creates a test user account via the register endpoint.
 * Returns the account _id.
 */
export async function ensureTestUser(
   app: NestExpressApplication,
   _mongoProvider: TestMongoConnectionProvider,
   user: typeof TEST_USER = TEST_USER
): Promise<string> {
   const server = app.getHttpServer();

   const res = await request(server)
      .post('/api/v1/auth/register')
      .set('x-test-sub', user.sub)
      .set('x-jurisdiction', TEST_JURISDICTION)
      .set('Content-Type', 'application/json')
      .send({
         jurisdiction: TEST_JURISDICTION,
         auth_token: 'test-token',
         display_name: user.displayName,
      });

   if (res.status !== 200 || !res.body?.item?._id) {
      throw new Error(`ensureTestUser(${user.sub}) failed: status=${res.status} body=${JSON.stringify(res.body).substring(0, 200)}`);
   }
   return res.body.item._id as string;
}

/**
 * Returns a supertest helper pre-configured with the test user's auth headers.
 */
export function authedAgent(app: NestExpressApplication, user: typeof TEST_USER = TEST_USER): TestAgent {
   const server = app.getHttpServer();

   const wrap =
      (method: 'post' | 'get' | 'put' | 'delete' | 'patch') =>
      (url: string): request.Test =>
         request(server)
            [method](url)
            .set('x-test-sub', user.sub)
            .set('x-jurisdiction', TEST_JURISDICTION)
            .set('Content-Type', 'application/json');

   return {
      get: wrap('get'),
      post: wrap('post'),
      put: wrap('put'),
      patch: wrap('patch'),
      delete: wrap('delete'),
   };
}
