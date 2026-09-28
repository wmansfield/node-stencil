# Perspectives and projections

A Stencil document has many fields. Callers rarely need all of them, and writers rarely change all of them. The schema names those subsets.

- A **projection** is a **read**. It is the list of fields this caller is allowed to receive.
- A **perspective** is a **write**. It is the list of fields this update is allowed to change.

They are declared in `stencil-entities.xml`. The generator turns each one into a TypeScript type and a manager method. Product code uses those names. It does not invent a second shape in the controller.

`Account` in this repo is the worked example. Open that `<item>` while you read this.

## Projection

`Account` stores email, roles, `auth_identifier`, a display name, an avatar, and more. A public list of people must not receive the private fields. The schema says so:

```xml
<projection name="Public" get="true">
  <entry>_id</entry>
  <entry>jurisdiction_id</entry>
  <entry>display_name</entry>
  <entry>avatar</entry>
</projection>
```

The generator emits:

- A type, `Account.Public`, with only those fields.
- A Mongo field mask, `Account.Public.Projection`.
- Because `get="true"`, a getter such as `getByIdPublic` that runs `.select(Account.Public.Projection)`.

The database returns the mask. Email and `auth_identifier` are not in the payload, so a later `res.json` cannot accidentally include them.

Other projections on the same account are different callers:

| Projection | Who it is for | What it includes |
|------------|----------------|------------------|
| `Public` | Someone else looking at this account | Id, jurisdiction, display name, avatar |
| `Self` | The signed-in account looking at itself | Those, plus email, roles, status, a `token` field that exists only on this shape |
| `Identity` | Auth lookup | `_id` and `auth_identifier` |
| `Internal` | Server-side work that needs the address | `_id` and `email` |

`Self` shows that a projection can add a field that is not stored (`token`, `impersonated`). That field is part of the response shape, filled by code, and still absent from `Public`.

`get="true"` is what creates the query. Without it you still have the type. You do not have `getByIdPublic`.

The full-document read mask omits `searchable`. That field is a concatenated blob for list search. It is not something an API should return.

### What a projection is for

**Leak control.** If email must not appear on a card list, email is absent from that projection. Stripping the property in the controller after a full load is a different, weaker habit: the database already sent the field, and the next endpoint can forget the strip. End-to-end tests (`expectStrictResponseShape`) fail when the JSON has keys the shape does not declare.

**Cost.** A list loads the mask, not the whole document. A `Reference` projection is the id plus the display fields a list needs, stored at write time so the list does not join.

**Names.** Two projections on one response collide if both entities used a generic `name`. `board_name` and `card_title` stay distinct when the shapes are combined.

## Perspective

A perspective groups fields that change together. On `Account`:

| `perspective` | Fields |
|---------------|--------|
| `Info` | `display_name`, `asset_id_avatar` |
| `Status` | `email`, `account_status` |
| `Permissions` | `roles` |

`perspective="Info"` on those fields generates `Account.InfoPerspective`, `asInfoPerspective()`, and `accountManager.updateInfoPerspective(...)`.

That method writes a Mongo `$set` / `$unset` of **exactly** the Info fields, then runs that group's sanitize, validate, and pre/post hooks. A rename of `display_name` leaves `account_status` and `roles` untouched.

That is the concurrency story. One request can update Info while another updates Status. Each write names its group, so the second does not paste the first's stale copy of the other fields back over the document.

### One field, one perspective

A field belongs to **one** perspective. `perspective` is a single attribute, and that limit is intentional.

Each perspective is a reason to write. If `display_name` were in both Info and Status, `updateStatusPerspective` would be allowed to overwrite a name that Info had just saved, for a different reason. Keeping the field in one group means only that reason’s update can change it.

When two reasons both need to affect what people see, store **two fields**, one in each perspective, and a **calculated** field that aggregates them. Writers update their own field. `applyCalculations` on the manager fills the aggregate. Readers use the aggregate. Neither perspective `$set`s it.

Example: an owner sets `title_owner` (Info) and a moderator sets `title_moderator` (Moderation). A calculated `title` is the one lists show. Moving `title` into both perspectives would let the moderator’s save wipe the owner’s text.

`Widget` uses the same idea for copy: `title_localized`, `description`, and `description_localized` share `perspective="Config"`. Updating the description does not rewrite the media asset or the published date. Choosing a language and writing it back into `title` or `description` is a separate feature-endpoint step: [Localized content](./localized-content.md).

### Replace

`replace` writes the document from the object you pass. Fields you left out can be cleared. Fields another request changed since you loaded the document can be overwritten with your old copy.

Generated admin CRUD still calls `replace`. That screen is a privileged edit of the whole row, the way a database console is. Product `/v1` code uses perspectives. If the field you need is not in a group yet, add `perspective="..."` in the XML and regenerate.

`insert` and `replace` still run every perspective's mutation hooks, so a rule on Info runs when the row is created and when an admin replaces it, not only on `updateInfoPerspective`.

## Side by side

| | Projection | Perspective |
|--|------------|-------------|
| Direction | Read | Write |
| In XML | `<projection name="Public">` and `<entry>` children | `perspective="Info"` on each field in the group |
| Generated | `Account.Public`, `Account.Public.Projection`, `getByIdPublic` when `get="true"` | `Account.InfoPerspective`, `updateInfoPerspective` |
| Mongo | `.select(mask)` | `$set` / `$unset` of that group |
| Mistake it prevents | Shipping email on a public list | A rename wiping status, roles, or a concurrent edit |

## On the kanban

A board list for other people is a **Public projection**: id and `board_name`. Email and `auth_identifier` are not entries.

Renaming a board is an **Info perspective**: `board_name` and description. A later “archive” or “move card” write is its own perspective (`deleted_utc`, or the card’s list and sequence). It does not `replace` the document and wipe the title.
