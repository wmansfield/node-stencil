# Feature Controller Pattern

Feature controllers are hand-written NestJS endpoints for app/admin/platform behavior. XML generates the request/response models and client APIs; it does not implement backend feature controllers.

## Standard User Endpoint Shape

```typescript
@RateLimit({ points: 60, duration: 60 })
@UseGuards(AuthGuard, RateLimitGuard)
@Post('list')
@HttpCode(200)
async list(
   @Req() request: StencilRequest,
   @Body(Sanitize.for(ThingFilter)) input: IThingFilter
): Promise<ListResult<Thing.Public>> {
   if (!request.account) {
      throw new ForbiddenException();
   }
   const jurisdiction_id = request.account.jurisdiction_id;
   // Use jurisdiction_id for isolated data access.
}
```

## Rules

- Every `@Body()` in `backend/src/features/**/*.controller.ts` uses `Sanitize.for(...)` or explicit `Sanitize.ignore()`.
- `Sanitize.for()` takes the generated class; the parameter type uses the generated interface.
- Authenticated `/v1/*` endpoints derive jurisdiction from `request.account.jurisdiction_id`.
- Authenticated user endpoints use `AuthGuard`, `RateLimitGuard`, and `@RateLimit(...)`.
- Prefer typed envelopes: `ItemResult<T>`, `ListResult<T>`, or `ActionResult`.
- Use `UIException(new LocalizableString(...))` for user-facing soft failures the client should display.
- Webhooks usually use `Sanitize.ignore()`, header/provider authentication, internal validation, and a 200 acknowledgement shape.

## Generated Models

Feature model files under `backend/src/features/**/models/` may be generated from XML. Do not hand-edit them unless you have confirmed the file is hand-written. For contract changes, edit the XML `<feature>` and run the generator.

## Registration Checklist

- XML contract exists and generator has run.
- Controller route matches the generated route.
- Controller is registered in the correct module.
- Body sanitization uses the generated request class.
- Return type matches the generated response/projection.
- New user-facing behavior has E2E coverage or a documented reason for deferral.
