# Task Brief — UX Writing Overhaul (EN / ET / RU)

Date: 2026-05-16

## Goal

Replace placeholder, inconsistent, and generic copy across PetCura with a confident, Apple-style hybrid voice — adapted by surface — in all three supported locales (EN, ET, RU). The outcome is a product that reads like a single calm voice across marketing, the clinic app, the owner app, auth, transactional messages, and legal pages.

## User / Clinic Workflow Affected

Every PetCura user touches this work:
- **Pet owners** read intake, chat, magic-link emails, WhatsApp reminders, owner dashboard, owner-education page.
- **Clinic staff** live in the inbox, request detail, reminders, directory, settings.
- **Clinic buyers and compliance officers** evaluate marketing and legal pages.
- **Super-admin / ops** runs the admin console.

## Owner

Three external UX writers, one per locale:
- EN writer — canonical source, voice lead, doc maintainer.
- ET writer — Estonian fluency, partner-clinic verification.
- RU writer — Russian fluency, Cyrillic-rendering verification.

Reviewers:
- Reza — product, tone, sign-off.
- Codex — backend / data / AI claims / legal accuracy review for any `legal-sensitive` or `AI-sensitive` PR.
- Claude (frontend) — handles two prerequisite tickets (Cyrillic font subset; routing inline marketing strings through dictionaries).

## In Scope

- All keys in `packages/shared/src/i18n.ts` (~1018 EN keys plus enums) and `apps/web/lib/owner/i18n.ts` (~159 keys).
- All marketing pages: `/`, `/owners`, `/demo`, `/sandbox`, `/trust`.
- All clinic app pages: `/inbox`, `/requests/[id]`, `/directory`, `/customers/[ownerId]`, `/pets`, `/pets/[petId]`, `/reminders`, `/settings`, `/profile`, `/health`, `/reports`.
- All owner app and intake pages: `/owners`, `/o/login`, `/o/join/confirm`, `/o/(authed)`, `/o/(authed)/chat`, `/o/(authed)/me`, `/o/(authed)/services`, `/intake`.
- Admin console: `/admin`, `/onboarding/clinic`, `/onboarding/staff`.
- Auth: `/login`, `/o/login`, `/auth/callback`, `/o/auth/callback`.
- Legal pages: `/privacy`, `/terms`, `/dpa`, `/cookies`, `/subprocessors` — **plain-language pass only**, no legal-meaning changes.
- Transactional templates: magic-link email, owner-invite WhatsApp, owner-invite SMS, WhatsApp reminder.
- Design-system showcase `/design` — internal labels and captions polish.

## Out of Scope

- Code comments and developer-facing strings.
- AI prompt internals (Codex / eval-owned).
- Twilio backend templates beyond the four transactional messages above.
- Supabase migration scripts and DB enum values.
- Adding new product features. Writers only rewrite existing copy.

## Files Likely Touched

Writer-edited:
- `packages/shared/src/i18n.ts` (clinic, admin, auth, marketing, legal, status enums)
- `apps/web/lib/owner/i18n.ts` (owner app)
- `supabase/templates/magic_link.html` (after Codex parameterizes it for locale)
- New transactional template files (Codex creates; writers provide content):
  - `apps/web/lib/twilio/templates/owner-invite-whatsapp.{en,et,ru}.md`
  - `apps/web/lib/twilio/templates/owner-invite-sms.{en,et,ru}.md`
  - `apps/web/lib/twilio/templates/reminder-whatsapp.{en,et,ru}.md`
- `apps/web/app/(marketing)/_data/*` and `_sections/**/*.tsx` — only after Claude routes inline strings through the dictionary

Read-only references:
- `docs/content/voice-and-tone.md`
- `docs/content/microcopy-patterns.md`
- `docs/content/glossary.md`
- `docs/content/key-inventory.md`
- `docs/content/tasks/{en,et,ru}-task-list.md`
- `docs/compliance/public-legal-copy.md`
- `docs/design/a11y-i18n-contract-2026-05.md`

## Data/API Contract Changes

None. Writers do not change schemas, APIs, validation, or events. The dictionary types in TypeScript enforce that every key is present in all three locales — writers cannot add a key in one locale without adding it in the other two.

## UX Acceptance Criteria

- Voice consistency: every page reads as one of the six voice modes defined in `voice-and-tone.md` §3.
- Forbidden phrases (`voice-and-tone.md` §5) do not appear in any locale's dictionary.
- Anchor phrases (`voice-and-tone.md` §6) appear verbatim where required by the per-locale task lists.
- Empty states use active voice ("X appears here once Y") — banned: "No X yet."
- AI provenance label `Drafted by AI · review before sending.` (and locale equivalents) appears on every AI-authored string visible to staff.
- The clinic app contains zero exclamation marks across all three locales.
- Char budgets per tier (`key-inventory.md` Part C) respected — no clipping at 320 / 768 / 1280 viewports.
- Estonian diacritics correct (õ, ä, ö, ü).
- Cyrillic renders in the brand font on every Russian screen (requires the Cyrillic font subset prerequisite ticket to ship first).
- Legal pages open with a 2-sentence plain-language summary in each locale.
- Every legal-sensitive or AI-sensitive PR has Codex sign-off recorded in the PR review.

## Test Plan

Per wave:
- `npm run lint` and `npm run typecheck` — green.
- `npm run test:visual` — screenshot diffs reviewed; no unintended layout shifts.
- `npm run test:e2e` — golden-path Playwright runs at `?lang=en` (plus `et` and `ru` where set up).
- Manual: walk the wave's surfaces at each locale, in light and dark themes, at 320 / 768 / 1280 viewports.

Per release (end of all five waves):
- Lighthouse Accessibility = 100 on `/`, `/owners`, `/privacy`, `/terms`, `/dpa`, `/cookies`, `/subprocessors`, `/trust` — light and dark, all three locales.
- VoiceOver smoke test on the marketing landing and owner intake — landmarks, heading order, no decorative icon names read.
- Manual side-by-side EN/ET/RU read-through with Reza.
- Compliance officer (or Reza standing in) reads each legal page; can summarise it in 3 sentences per locale.

## Prerequisite tickets (Claude / Codex must finish before writers ship Wave A)

1. **Cyrillic font subset** (Claude / frontend). Add `"cyrillic"` to the `next/font` subsets in the root layout so Russian text renders in the brand font. Blocks RU Wave A.
2. **Route inline marketing strings through the dictionary** (Claude / frontend). Audit `_data/*` and `_sections/**/*.tsx`; move any inline `string` literals into the `landing.*` namespace so the writer edits one place. Blocks EN/ET/RU Wave E.
3. **Locale-aware magic-link email** (Codex / backend). Parameterise `supabase/templates/magic_link.html` by locale and render the writer-provided ET and RU variants. Blocks Wave D.
4. **WhatsApp / SMS template surface** (Codex / backend). Create the three template files (owner-invite, reminder) with a locale-keyed structure so writers can fill them. Blocks Wave D.

## Wave timing (recommended)

| Wave | Scope | EN | ET | RU |
|---|---|---|---|---|
| A | Foundations (~80 strings) | Week 1 | Week 1 (after EN) | Week 1 (after EN + Cyrillic fix) |
| B | Owner surfaces (~225) | Week 1–2 | Week 2 | Week 2 |
| C | Clinic surfaces (~430) | Week 2–3 | Week 3 | Week 3 |
| D | Auth / Admin / Transactional (~135 + 4 templates) | Week 3 | Week 3–4 | Week 3–4 |
| E | Marketing / Legal polish (~360) | Week 3–4 | Week 4 | Week 4 |

Weekly Monday sync (30 min): EN walks through upcoming-wave drafts; ET and RU ask questions before they translate; Reza signs off on tone for the prior wave.

## Risks

1. **Tone drift across three writers** — mitigated by `voice-and-tone.md` + the Monday sync + Reza reviewing all Wave A PRs side by side before Wave B opens.
2. **Legal/AI claim regression** — mitigated by Codex review on any `legal-sensitive` or `AI-sensitive` PR.
3. **Cyrillic rendering fallback** — mitigated by the prerequisite font-subset ticket.
4. **Inline marketing strings** — mitigated by the prerequisite routing ticket.
5. **Estonian and Russian text expansion** — mitigated by per-tier char budgets in the inventory and the a11y/i18n contract's 320px-floor rule.

## Done When

- Every key in both dictionaries has a final EN, ET, RU value (TypeScript build green).
- All four transactional templates ship in all three locales.
- Legal pages have plain-language summaries in all three locales.
- `voice-and-tone.md`, `microcopy-patterns.md`, `glossary.md`, `key-inventory.md` are in `docs/content/` and reflect the final shipped state.
- Forbidden phrases absent from all three locale dictionaries (grep verified).
- Reza signs off after the cross-locale walk.
- A user (clinic vet nurse, pet owner, compliance officer — one of each per locale) can complete their representative task without copy confusion.

## Source documents

- `docs/content/voice-and-tone.md`
- `docs/content/microcopy-patterns.md`
- `docs/content/glossary.md`
- `docs/content/key-inventory.md`
- `docs/content/tasks/en-task-list.md`
- `docs/content/tasks/et-task-list.md`
- `docs/content/tasks/ru-task-list.md`
- `docs/compliance/public-legal-copy.md`
- `docs/design/a11y-i18n-contract-2026-05.md`
- `AGENTS.md`
- `CLAUDE.md`
