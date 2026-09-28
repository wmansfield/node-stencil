# Localized Content

The default language is the ordinary field. Other languages are an embedded `*_localized` array on the same document. Generated CRUD returns both as stored. A feature endpoint is what copies one language onto the ordinary field and returns that field.

| Pair | Default field | Translation array | What gets copied |
|------|----------------|-------------------|------------------|
| String | `title: string` | `title_localized: LocalizedText[]` | `text` |
| Body | `description: ContentSection[]` | `description_localized: LocalizedContent[]` | `contents` |

`LocalizedContent.contents` and the default body are the same type. A string field cannot receive `contents`.

## Widget read

`POST /api/v1/widgets/get` (`WidgetsController.get`):

1. Take jurisdiction from `request.account.jurisdiction_id`.
2. Load the **full** widget with `getById`. `Widget.Public` omits `title_localized` and `description_localized`, so `getByIdPublic` cannot supply the arrays you translate from.
3. `cloneDeep` before writing. The stored row stays on the default language.
4. `WidgetUtils.prepareForLanguage(widget, language_code)` when the caller sent a language. A missing code, or a code with no entry, leaves `title` and `description` as stored.
5. Return `ItemResult` of `widget.toPublic()`.

`prepareForLanguage` builds a map of `language_code` → `{ title, description }` and assigns a hit onto the widget. It does not insert, replace, or update a perspective.

Admin `/api/admin/:jurisdiction_id/widget` is unchanged. It is generated CRUD, not this feature.

## When you add another entity

Store the default in the field clients already read. Store other languages in a sibling `LocalizedText[]` or `LocalizedContent[]` on the same perspective as that field. Add a projection that includes the default field and omits the arrays. Do the copy in the feature controller (or a util it calls), on a clone, and return the projection.

Intro: [`docs/intro/localized-content.md`](../../../../docs/intro/localized-content.md).
