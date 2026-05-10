# Security and Compliance

## Posture

PetCura is the data processor. The clinic is the data controller.

Primary application data is hosted in EU regions. Subprocessors, transfer mechanisms, retention periods, AI inference settings, and support access policies must be documented before pilot go-live.

## Security Requirements

- Supabase Auth for staff.
- Magic-link auth by default; 2FA for clinic admins when supported.
- RLS on all domain tables.
- No service-role key in client-side code.
- Webhook signatures verified for Twilio inbound events.
- Webhook handlers are idempotent.
- Secrets are stored only in platform secret stores.
- Audit staff/system actions in `audit_logs`.

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
