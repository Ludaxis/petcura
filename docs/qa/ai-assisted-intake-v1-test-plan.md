# AI-Assisted Clinic Intake V1 QA Plan

Last updated: 2026-05-14.

Status: executable unit coverage exists for contracts, validation, emergency rules, open-hours rules, and route-only service intent. Full Supabase-backed E2E remains environment-gated.

## Readiness Snapshot

- Existing validation coverage: `packages/validation/src/intake.test.ts` checks basic owner intake normalization, `webIntakeStartSchema`, `webIntakeMessageSchema`, consent, and rejects `urgent` as a request status.
- Existing AI contract coverage: `packages/ai/src/index.test.ts` checks `intake_question`, summary, translation, summary localization, memory extraction, context retrieval, and reply draft schemas.
- Existing web unit coverage: `apps/web/lib/intake/ai-assisted-core.test.ts` checks emergency detection, service-intent mapping, safe fallback output, open/closed-hours logic, and after-hours emergency policy copy.
- Existing e2e coverage: `apps/web/tests/e2e/live-intake.spec.ts` verifies web intake reaches the authenticated clinic inbox and request detail when Supabase env is available.

## Remaining Focused Tests

- Supabase integration: `POST /api/intake/web/start` creates request, message, session, events, advisory request fields, and `ai_outputs.kind = intake_question`.
- Supabase integration: `POST /api/intake/web/message` appends to the same request/session with idempotency and refreshes the intake handoff.
- RLS: anonymous cannot read `clinic_web_intake_configs`, `web_intake_sessions`, emergency policy, `ai_outputs`, or tenant request data directly.
- Playwright: normal intake, emergency intake, after-hours intake, grooming/delivery intent routing, manual fallback, EN/ET/RU expansion, keyboard flow, mobile/desktop, and dark mode.

## Acceptance Criteria

- AI writes `ai_outputs` rows for intake assistance with model, prompt version, input, output, confidence, token usage, latency, and review state.
- Emergency detection is advisory, visible to staff, audited, and does not set final urgency or send medical advice automatically.
- Open-hours behavior uses clinic timezone and documented hours, with deterministic fallback when hours are missing.
- Service intent suggestions are route-only and fall back to general/admin intake when no service intent matches.
- All owner-facing medical content still requires staff approval unless it is non-medical intake collection or translation.

## Suggested Verification

- `npm run test:ai`
- `npm run test -w @petcura/validation`
- `npm run test -w @petcura/web`
- `npm run test:e2e -w @petcura/web`
