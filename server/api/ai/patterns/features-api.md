# Features API Pattern

Features define typed API contracts in XML. They generate request/response models plus frontend RTK Query clients. Backend feature controllers are hand-written.

## XML Structure

```xml
<feature name="profile" area="user">
  <entity name="Account.Self" isItem="true"/>
  <entity name="NameRequest">
    <field type="string">display_name</field>
  </entity>
  <entity name="AvatarRequest">
    <field type="Uuid">asset_id</field>
  </entity>

  <mutation name="nameUpdate"
            route="v1/profile/name"
            request="params"
            requestType="NameRequest"
            itemResult="Account.Self" />

  <mutation name="avatarUpdate"
            route="v1/profile/avatar"
            request="params"
            requestType="AvatarRequest"
            itemResult="Account.Self" />
</feature>
```

## Feature Attributes

| Attribute | Description |
|-----------|-------------|
| `name` | Feature identifier (lowercase) |
| `area` | Grouping: `user`, `admin` |

## Entity Element (within feature)

| Attribute | Description |
|-----------|-------------|
| `name` | Type name (can include projection like `Account.Public`) |
| `isItem="true"` | Reference to existing entity/projection |
| Fields | Define custom request/response fields |

## Query Element (GET endpoints)

```xml
<query name="methodName" 
       route="v1/path/${param}" 
       request="param" 
       requestType="string" 
       itemResult="ResponseType" />
```

| Attribute | Description |
|-----------|-------------|
| `name` | Method name in generated API |
| `route` | URL path (can include `${var}` interpolation) |
| `request` | Parameter name |
| `requestType` | Parameter type |
| `itemResult` | Single item response type |
| `listResult` | Array response type |
| `post="true"` | Use POST instead of GET |

## Mutation Element (POST endpoints)

```xml
<mutation name="methodName" 
          route="v1/path" 
          request="params" 
          requestType="RequestType" 
          itemResult="ResponseType" />
```

Same attributes as query, but defaults to POST.

## MCP Tools

Add an `<mcp>` child to a `<query>` or `<mutation>` to expose it as an MCP tool. Operations without one are not reachable over MCP. The attribute contract, validation rules, and generated files are in `code-generation.md` ("MCP tools"). Give request fields a `friendlyName` and `description`; they become the tool's argument documentation.

## Authentication Attributes

```xml
<mutation name="register" 
          route="v1/auth/register" 
          authToken="params.auth_token" 
          authJurisdiction="params.jurisdiction"
          request="params" 
          requestType="RegisterRequest" 
          itemResult="Account.Self" />
```

| Attribute | Description |
|-----------|-------------|
| `authToken` | Path to auth token in request |
| `authJurisdiction` | Path to jurisdiction in request |

## Generated client

A `<feature>` is an HTTP contract. The generator emits a **TypeScript** RTK Query client and the request/response types. Any JavaScript or TypeScript caller can use that client. It is not a mobile-app API.

In this repository the consumer is the React admin frontend:

- Client: `frontend/src/stencil/endpoints/features/{area}/{feature}Api.ts`
- Types: `frontend/src/stencil/models/features/{area}/{feature}/`

A Stencil checkout that includes a native app can generate a second client from the same XML. This one does not. Do not look for `app/src/`.

```typescript
const profileApi = apiService
   .enhanceEndpoints({ addTagTypes })
   .injectEndpoints({
      endpoints: build => ({
         nameUpdate: build.mutation<ItemResult<IAccount_Self>, INameRequest>({
            query: (params: INameRequest) => ({
               url: `v1/profile/name`,
               method: 'POST',
               data: params,
            }),
         }),
         avatarUpdate: build.mutation<ItemResult<IAccount_Self>, IAvatarRequest>({
            query: (params: IAvatarRequest) => ({
               url: `v1/profile/avatar`,
               method: 'POST',
               data: params,
            }),
         }),
      }),
   });

export const { useNameUpdateMutation, useAvatarUpdateMutation } = profileApi;
```

## Common Feature Patterns

### Auth Feature
```xml
<feature name="auth" area="user">
  <mutation name="getSelf" route="v1/auth/self" authToken="auth_token" ... />
  <mutation name="register" route="v1/auth/register" authToken="params.auth_token" ... />
</feature>
```

### CRUD-like Feature
```xml
<feature name="widget" area="user">
  <mutation name="listMine" route="v1/widgets/mine" ... listResult="Widget.Public" />
  <mutation name="create" route="v1/widgets/create" ... itemResult="Widget.Public" />
</feature>
```

### Media Upload Feature
```xml
<feature name="media" area="user">
  <mutation name="uploadPrepare" route="v1/media/${params.jurisdiction_id}/prepare" ... itemResult="PreSignedUrl" />
  <mutation name="uploadComplete" route="v1/media/${params.jurisdiction_id}/complete" ... itemResult="JurisdictionAsset.Info" />
</feature>
```

## Backend Implementation

Features generate types but the actual endpoint implementation is in `backend/src/features/{feature}/`:

```typescript
// backend/src/features/user/profile/profile.controller.ts
@Controller('v1/profile')
export class ProfileController {
  @Post('name')
  async nameUpdate(
    @Req() request: StencilRequest,
    @Body(Sanitize.for(NameRequest)) input: INameRequest
  ): Promise<ItemResult<Account.Self>> {
    // Implementation
  }
}
```

The backend feature controllers are NOT generated - they're manually implemented using the generated types.

Language resolution is one of those hand-written steps. Widget `get` (`v1/widgets/get`) copies a requested language onto `title` and `description` and returns `Widget.Public`. Generated widget CRUD does not. See [`localized-content.md`](./localized-content.md).

For controller rules, read `feature-controllers.md`. The short version:

- Use `Sanitize.for(RequestClass)` for generated request models.
- Use `request.account.jurisdiction_id` for authenticated user route data access.
- Use `ItemResult<T>`, `ListResult<T>`, or `ActionResult` response envelopes.
- Pair authenticated user endpoints with `AuthGuard`, `RateLimitGuard`, and `@RateLimit(...)`.
