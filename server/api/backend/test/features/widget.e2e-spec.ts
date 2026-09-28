import { createTestApp, teardownTestApp, TestContext } from '../setup/test-app';
import {
   seedJurisdiction,
   ensureTestUser,
   authedAgent,
   TEST_JURISDICTION,
   TestAgent,
} from '../setup/test-helpers';
import { expectStrictItemShape, NestedTypeMap } from '../setup/response-shape';
import { EntityRegistry } from 'src/entities/entity.registry';
import { Widget } from 'src/entities/widget/widget.model';
import { ContentSection } from 'src/entities/contentsection/contentsection.model';
import { ContentSectionKind } from 'src/entities/enums/contentsectionkind';
import { LocalizedText } from 'src/entities/localizedtext/localizedtext.model';
import { LocalizedContent } from 'src/entities/localizedcontent/localizedcontent.model';
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';
import { FullDate } from 'src/entities/fulldate/fulldate.model';

import 'src/entities/widget/widget.sanitized.validators';
import 'src/entities/contentsection/contentsection.sanitized.validators';
import 'src/entities/mediainfo/mediainfo.sanitized.validators';
import 'src/entities/fulldate/fulldate.sanitized.validators';

const WIDGET_ID = '11111111-1111-4111-8111-111111111111';

const WIDGET_PUBLIC_NESTED: NestedTypeMap = {
   description: [ContentSection],
   media: MediaInfo,
   avatar: MediaInfo,
   published_date: FullDate,
};

describe('Widget Feature (e2e)', () => {
   let ctx: TestContext;
   let http: TestAgent;

   beforeAll(async () => {
      ctx = await createTestApp();
      await seedJurisdiction(ctx.mongoProvider);
      await ensureTestUser(ctx.app, ctx.mongoProvider);
      http = authedAgent(ctx.app);

      const entities = ctx.app.get(EntityRegistry);
      const widget = new Widget({
         _id: WIDGET_ID,
         jurisdiction_id: TEST_JURISDICTION,
         title: 'Default title',
         title_localized: [
            new LocalizedText({ language_code: 'es', text: 'Titulo' }),
         ],
         description: [
            new ContentSection({
               section_kind: ContentSectionKind.markdown,
               markdown: 'Default body',
               sequence: 0,
            }),
         ],
         description_localized: [
            new LocalizedContent({
               language_code: 'es',
               contents: [
                  new ContentSection({
                     section_kind: ContentSectionKind.markdown,
                     markdown: 'Cuerpo',
                     sequence: 0,
                  }),
               ],
            }),
         ],
      });
      await entities.widgetManager.insert(TEST_JURISDICTION, widget);
   }, 120_000);

   afterAll(async () => {
      if (ctx) {
         await teardownTestApp(ctx);
      }
   });

   describe('language', () => {
      it('returns the stored default when no language is requested', async () => {
         const res = await http.post('/api/v1/widgets/get').send({ widget_id: WIDGET_ID });

         expect(res.status).toBe(200);
         expect(res.body.success).toBe(true);
         expect(res.body.item.title).toBe('Default title');
         expect(res.body.item.description[0].markdown).toBe('Default body');
         expect(res.body.item.title_localized).toBeUndefined();
         expect(res.body.item.description_localized).toBeUndefined();
      });

      it('writes the matching translation into the default fields', async () => {
         const res = await http
            .post('/api/v1/widgets/get')
            .send({ widget_id: WIDGET_ID, language_code: 'es' });

         expect(res.status).toBe(200);
         expect(res.body.item.title).toBe('Titulo');
         expect(res.body.item.description[0].markdown).toBe('Cuerpo');
         expect(res.body.item.description_localized).toBeUndefined();
      });

      it('keeps the stored default when the language has no translation', async () => {
         const res = await http
            .post('/api/v1/widgets/get')
            .send({ widget_id: WIDGET_ID, language_code: 'fr' });

         expect(res.status).toBe(200);
         expect(res.body.item.title).toBe('Default title');
         expect(res.body.item.description[0].markdown).toBe('Default body');
      });

      it('leaves the stored document on the default after a translated read', async () => {
         await http.post('/api/v1/widgets/get').send({ widget_id: WIDGET_ID, language_code: 'es' });

         const res = await http.post('/api/v1/widgets/get').send({ widget_id: WIDGET_ID });

         expect(res.status).toBe(200);
         expect(res.body.item.title).toBe('Default title');
         expect(res.body.item.description[0].markdown).toBe('Default body');
      });
   });

   describe('response shape', () => {
      it('returns only Widget.Public fields', async () => {
         const res = await http
            .post('/api/v1/widgets/get')
            .send({ widget_id: WIDGET_ID, language_code: 'es' });

         expect(res.status).toBe(200);
         expectStrictItemShape(res.body, Widget.Public, WIDGET_PUBLIC_NESTED);
      });
   });

   describe('auth and input', () => {
      it('returns 404 for an unknown widget', async () => {
         const res = await http
            .post('/api/v1/widgets/get')
            .send({ widget_id: '00000000-0000-4000-8000-000000000000' });

         expect(res.status).toBe(404);
      });

      it('rejects properties the request model does not allow', async () => {
         const res = await http
            .post('/api/v1/widgets/get')
            .send({ widget_id: WIDGET_ID, jurisdiction_id: 'ZZ' });

         expect(res.status).toBe(400);
      });

      it('returns 4xx for an unauthenticated read', async () => {
         const supertest = require('supertest');
         const res = await supertest(ctx.app.getHttpServer())
            .post('/api/v1/widgets/get')
            .send({ widget_id: WIDGET_ID });

         expect(res.status).toBeGreaterThanOrEqual(400);
         expect(res.status).toBeLessThan(500);
      });
   });
});
