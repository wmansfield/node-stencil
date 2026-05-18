# Features API Pattern

Features define API endpoints for user-facing clients. They're defined in XML and generate RTK Query hooks for the frontend and type definitions used by backend controllers.

## XML Structure

```xml
<feature name="auth" area="user" native="true">
  <!-- Custom types for this feature -->
  <entity name="RegisterRequest">
    <field type="string">jurisdiction</field>
    <field type="string">auth_token</field>
    <field type="string">display_name</field>
  </entity>

  <!-- Reference existing entity projections -->
  <entity name="Account.Self" isItem="true"/>

  <!-- GET endpoint -->
  <query name="getSelf"
         route="v1/auth/self"
         authToken="auth_token"
         request="auth_token"
         requestType="string"
         itemResult="Account.Self" />

  <!-- POST endpoint -->
  <mutation name="register"
            route="v1/auth/register"
            post="true"
            authToken="params.auth_token"
            authJurisdiction="params.jurisdiction"
            request="params"
            requestType="RegisterRequest"
            itemResult="Account.Self" />
</feature>
```

## Feature Attributes

| Attribute | Description |
|-----------|-------------|
| `name` | Feature identifier (lowercase) |
| `area` | Grouping: `user`, `admin` |
| `native="true"` | Generate frontend API hooks |

## Entity Element (within feature)

| Attribute | Description |
|-----------|-------------|
| `name` | Type name (can include projection like `Account.Self`) |
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

### Frontend (`frontend/src/stencil/endpoints/features/{area}/{feature}Api.ts`)

```typescript
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSelf: builder.query<IAccount_Self, string>({
      query: (auth_token) => ({
        url: 'v1/auth/self',
        method: 'POST',
      }),
    }),
    register: builder.mutation<IAccount_Self, IRegisterRequest>({
      query: (params) => ({
        url: 'v1/auth/register',
        method: 'POST',
        body: params,
      }),
    }),
  }),
});

export const {
  useGetSelfQuery,
  useRegisterMutation,
} = authApi;
```

## Existing Features

| Feature | Area | Endpoints |
|---------|------|-----------|
| `auth` | user | `getSelf`, `register` |
| `profile` | user | `nameUpdate`, `avatarUpdate` |
| `media` | user | `uploadPrepare`, `uploadComplete` |
| `Task` | admin | `triggerInvalidateEverything`, `triggerSynchronization`, `triggerIndexSync`, `triggerImageResize`, `triggerRoleSync` |

## Backend Implementation

Features generate types but the actual endpoint implementation is in `backend/src/features/{feature}/`:

```typescript
// features/user/auth/auth.controller.ts
@Controller('v1/auth')
export class AuthController {
  @Post('register')
  async register(@Body(Sanitize.for(RegisterRequest)) input: IRegisterRequest): Promise<ItemResult<Account.Self>> {
    // Implementation
  }
}
```

Backend feature controllers are **not generated** — they're manually implemented using the generated types.
