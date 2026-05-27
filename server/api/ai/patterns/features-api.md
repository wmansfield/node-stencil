# Features API Pattern

Features define API endpoints for the native mobile app. They're defined in XML and generate request/response models plus client API hooks. Backend feature controllers are hand-written.

## XML Structure

```xml
<feature name="profile" area="user" native="true">
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
| `native="true"` | Generate mobile app code |

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

## Generated Output

### Mobile App (`app/src/cloud/api/{feature}Api.ts`)

```typescript
export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    nameUpdate: builder.mutation<Account.Self, NameRequest>({
      query: (params) => ({
        url: 'v1/profile/name',
        method: 'POST',
        body: params,
      }),
    }),
    avatarUpdate: builder.mutation<Account.Self, AvatarRequest>({
      query: (params) => ({
        url: 'v1/profile/avatar',
        method: 'POST',
        body: params,
      }),
    }),
  }),
});

export const {
  useNameUpdateMutation,
  useAvatarUpdateMutation,
} = profileApi;
```

### Mobile App Types (`app/src/cloud/models/entities/*.ts`)

Request and response types are generated alongside the API.

## Common Feature Patterns

### Auth Feature
```xml
<feature name="auth" area="user" native="true">
  <mutation name="getSelf" route="v1/auth/self" authToken="auth_token" ... />
  <mutation name="register" route="v1/auth/register" authToken="params.auth_token" ... />
</feature>
```

### CRUD-like Feature
```xml
<feature name="widget" area="user" native="true">
  <mutation name="listMine" route="v1/widgets/mine" ... listResult="Widget.Public" />
  <mutation name="create" route="v1/widgets/create" ... itemResult="Widget.Public" />
</feature>
```

### Media Upload Feature
```xml
<feature name="media" area="user" native="true">
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

For controller rules, read `feature-controllers.md`. The short version:

- Use `Sanitize.for(RequestClass)` for generated request models.
- Use `request.account.jurisdiction_id` for authenticated user route data access.
- Use `ItemResult<T>`, `ListResult<T>`, or `ActionResult` response envelopes.
- Pair authenticated user endpoints with `AuthGuard`, `RateLimitGuard`, and `@RateLimit(...)`.
