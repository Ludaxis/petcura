# Localization

PetCura supports English, Estonian, and Russian from the foundation stage.

## Supported Locales

- `en`: English
- `et`: Estonian
- `ru`: Russian

English is the fallback locale.

## Product Rule

Both owner-facing and clinic-facing surfaces must work in all supported languages:

- Owner intake
- Clinic inbox
- Request detail
- Reminder and reply flows when added
- AI summaries, reply drafts, and translations when added

No new user-visible text should be hardcoded directly inside pages or components unless it is a proper noun, product name, or technical identifier.

## Implementation

Shared localization utilities live in:

- `packages/shared/src/i18n.ts`

The current web app reads the locale from the `lang` query parameter:

- `?lang=en`
- `?lang=et`
- `?lang=ru`

Use `normalizeLocale()` for incoming values and `createTranslator()` for UI copy.

Use typed label helpers for domain enums:

- `getRequestCategoryLabel()`
- `getRequestStatusLabel()`
- `getUrgencyLabel()`
- `getChannelLabel()`
- `getSenderLabel()`

Use `withLocale()` for internal links so the selected language follows the user through owner and clinic workflows.

## AI Translation Rule

AI translation is a product feature, not a replacement for localized UI. Interface copy must come from the localization dictionary. Owner messages, staff replies, summaries, and drafts may be translated through the AI layer and cached per message.

## Next Upgrade

Before pilot, replace query-string locale selection with persisted preference:

- owner preferred language from `owners.preferred_language`
- staff preferred language from `users.locale`
- browser language as first-visit default
- `lang` query parameter as explicit override
