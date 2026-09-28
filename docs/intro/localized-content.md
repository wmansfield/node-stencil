# Localized content

A caller should read one field. That field holds the default language. Other languages are stored beside it, and a feature endpoint copies the requested language back into the field before the response goes out.

Widget is the example.

| Field | What it stores |
|-------|----------------|
| `title` | Default-language string |
| `title_localized` | `LocalizedText[]`: `language_code` plus `text` |
| `description` | Default-language body, a `ContentSection[]` |
| `description_localized` | `LocalizedContent[]`: `language_code` plus `contents` (`ContentSection[]`) |

`LocalizedText` is the string form. `LocalizedContent` is the same idea for a body of sections (markdown, header, image, and the other `ContentSectionKind` values). The default body has to be `ContentSection[]`, the same shape as one language's `contents`, so the feature can replace `description` with that array. Both types are embedded `classOnly` values on the parent document. They are not their own collections.

## What CRUD returns

Admin widget routes (`/api/admin/:jurisdiction_id/widget`) read and write the stored document. A get returns `title` and `description` as the default language, and `title_localized` / `description_localized` as the full translation list. Those routes are generated CRUD. They do not take a language and they do not rewrite the default fields.

There is no XML attribute that selects a language at read time. The generator does not emit this step.

## What the feature does

`POST /api/v1/widgets/get` is the hand-written read. The body is `widget_id` and an optional `language_code`. Jurisdiction comes from `request.account`.

The controller loads the full widget (the public projection omits the translation arrays, so it cannot be the document you translate from), copies it, and calls `WidgetUtils.prepareForLanguage`. When `language_code` matches an entry, `text` is written onto `title` and `contents` is written onto `description`. When it does not match, or when the caller omits the language, the stored defaults stay. The copy is not saved.

The response is `Widget.Public`: `_id`, `jurisdiction_id`, `title`, `description`, `media`, `avatar`, `published_date`. The translation arrays are left off, so the client reads the same fields it would read for a single language.

Implementation: `server/api/backend/src/features/user/widget/widget.controller.ts` and `widget.utils.ts`. Agent notes: [`patterns/localized-content.md`](../../server/api/ai/patterns/localized-content.md).
