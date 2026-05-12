# Localization

Last updated: 2026-05-12.

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

The current web app resolves locale in this order:

1. `lang` query parameter
2. `petcura_locale` cookie
3. `Accept-Language` browser header
4. English fallback

Supported explicit query values:

- `?lang=en`
- `?lang=et`
- `?lang=ru`

Use `normalizeLocale()` for incoming values and `createTranslator()` for UI copy. Use `getRequestLocale()` inside the web app so pages and document metadata agree.

Use typed label helpers for domain enums:

- `getRequestCategoryLabel()`
- `getRequestStatusLabel()`
- `getUrgencyLabel()`
- `getChannelLabel()`
- `getSenderLabel()`

Use `withLocale()` for internal links so the selected language follows the user through owner and clinic workflows.

## AI Translation Rule

AI translation is a product feature, not a replacement for localized UI. Interface copy must come from the localization dictionary. Owner messages, staff replies, summaries, and drafts may be translated through the AI layer and cached per message.

AI memory does not alter translation prompts. Memory-assisted reply drafts store both `source_locale` and `target_locale` in `ai_outputs.input_json` so the request detail card can display stable draft language metadata even after regeneration or page reload.

## Next Upgrade

Before pilot, connect persisted preference to database records:

- owner preferred language from `owners.preferred_language`
- staff preferred language from `users.locale`
- browser language as first-visit default
- `lang` query parameter as explicit override
