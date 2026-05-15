# Security and Compliance

Last updated: 2026-05-15.

## Posture

PetCura is the data processor. The clinic is the data controller.

Primary application data is hosted in EU regions. Subprocessors, transfer mechanisms, retention periods, AI inference settings, and support access policies must be documented before pilot go-live.

## Security Requirements

- Supabase Auth for staff.
- Magic-link auth by default; 2FA for clinic admins when supported.
- RLS on all domain tables, enforced by active `clinic_staff` membership.
- RLS SQL tests are promotion blockers and must run in CI through `supabase test db --local`.
- Anonymous users must not read domain tables; public intake uses server-side `sb_secret_...` writes only.
- No Supabase secret key in client-side code. Browser and SSR clients use `sb_publishable_...`.
- Webhook signatures verified for Twilio inbound events.
- Webhook handlers are idempotent.
- Secrets are stored only in platform secret stores.
- Audit staff/system actions in `audit_logs`.
- Health/readiness output may expose which configuration keys are missing, but must never expose values, bearer tokens, cookies, service keys, or raw provider responses.

## AI Memory V1

- Memory prompts use the minimum necessary source excerpts for the active request.
- Memory outputs are processor-held derived data and remain subject to clinic-controlled export, retention, and erasure.
- `memory_extraction`, `context_retrieval`, and `ai_memory_sources` records must preserve source references for auditability.
- Staff must accept, edit, reject, or expire memory before it becomes retrievable context.
- No cross-clinic memory retrieval, provider-side training, unreviewed owner personalization, or clinic-wide profiling is allowed in V1.
- AI inference settings and subprocessors must explicitly cover memory prompts before pilot use.
- Manual QA on 2026-05-12 verified anonymous denial, viewer read-only behavior, viewer write denial, inactive staff denial, and cross-clinic denial for AI memory rows.
- On-demand AI drafts now record both source and target locale metadata so staff-facing draft audit labels do not rely on inference from UI state.

## GDPR Requirements

- DPA signed before pilot.
- Subprocessor list maintained.
- Owner data export flow.
- Right-to-erasure flow.
- Retention policy for resolved requests.
- Breach notification playbook with 72-hour SLA.

## Public Website Requirements

- `/privacy`, `/cookies`, `/subprocessors`, and `/trust` must stay aligned with `docs/contracts/trust-center.md` and `docs/compliance/public-legal-copy.md`.
- Public copy must describe PetCura as processor for clinic-controlled communication data and avoid completed certification claims until evidence exists.
- Cookie and analytics claims must match the deployed consent behavior and cookie inventory before launch.
- Subprocessor claims must match signed vendor DPAs, configured regions, transfer safeguards, and AI inference settings before launch.
- `/.well-known/security.txt`, `robots.txt`, `sitemap.xml`, global security headers, and scanner-path handling are part of the public security baseline.

## Pilot Gate Policy

Before Alex or any second clinic uses staging for real workflow testing:

- CI app, RLS, smoke, and accessibility lanes must be green.
- `/health?strict=1` must be checked on `app.petcura.app` and `my.petcura.app`.
- Twilio webhook fixtures must cover valid signature, duplicate callback, and unknown SID regressions before outbound changes promote.
- Accessibility scans must show zero serious/critical issues for public auth, owner, and clinic entry points. Until `@axe-core/playwright` is installed, the custom Playwright accessibility lane is the minimum gate and axe is a documented follow-up.
- Any failing RLS, auth, webhook signature, or health gate blocks promotion.

## Do Not Store

- production secrets
- real owner PII in seed data
- clinic credentials in repo
- raw production exports in repo
