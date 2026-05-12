# Security and Compliance

## Posture

PetCura is the data processor. The clinic is the data controller.

Primary application data is hosted in EU regions. Subprocessors, transfer mechanisms, retention periods, AI inference settings, and support access policies must be documented before pilot go-live.

## Security Requirements

- Supabase Auth for staff.
- Magic-link auth by default; 2FA for clinic admins when supported.
- RLS on all domain tables, enforced by active `clinic_staff` membership.
- Anonymous users must not read domain tables; public intake uses server-side `sb_secret_...` writes only.
- No Supabase secret key in client-side code. Browser and SSR clients use `sb_publishable_...`.
- Webhook signatures verified for Twilio inbound events.
- Webhook handlers are idempotent.
- Secrets are stored only in platform secret stores.
- Audit staff/system actions in `audit_logs`.

## AI Memory V1

- Memory prompts use the minimum necessary source excerpts for the active request.
- Memory outputs are processor-held derived data and remain subject to clinic-controlled export, retention, and erasure.
- `memory_extraction`, `context_retrieval`, and `ai_memory_sources` records must preserve source references for auditability.
- Staff must accept, edit, reject, or expire memory before it becomes retrievable context.
- No cross-clinic memory retrieval, provider-side training, unreviewed owner personalization, or clinic-wide profiling is allowed in V1.
- AI inference settings and subprocessors must explicitly cover memory prompts before pilot use.

## GDPR Requirements

- DPA signed before pilot.
- Subprocessor list maintained.
- Owner data export flow.
- Right-to-erasure flow.
- Retention policy for resolved requests.
- Breach notification playbook with 72-hour SLA.

## Do Not Store

- production secrets
- real owner PII in seed data
- clinic credentials in repo
- raw production exports in repo
