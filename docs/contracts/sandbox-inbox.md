# Sandbox Inbox Contract

## Purpose

`/sandbox` is a static fake-data product tour for clinic buyers. It demonstrates the PetCura workflow without auth, Supabase writes, provider calls, or real PII.

## Allowed Content

The sandbox may show:

- A fake WhatsApp owner message.
- A structured request card with fake owner, pet, category, language, and suggested risk flags.
- An AI draft that is clearly labeled as a staff-reviewed draft.
- Staff approval controls in static preview form.
- A PMS export and audit-trail preview with fake identifiers.

## Prohibited Content

The sandbox must not:

- Redirect to auth.
- Read or write Supabase.
- Call AI providers, Twilio, PMS systems, or analytics APIs with PII.
- Use real clinic names, owner names, phone numbers, pets, medical records, or production exports.
- Let AI diagnose, prescribe, set final urgency, or auto-send medical advice.

## Data Source

Fake sandbox data lives in `apps/web/app/(marketing)/_data/landing.ts`. It should remain deterministic so screenshots, tests, and copy review are stable.

## Test Expectations

E2E tests should verify `/sandbox` renders without auth redirect, contains the fake product tour, and exposes no real-data or provider-call affordances.
