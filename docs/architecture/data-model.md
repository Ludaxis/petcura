# Data Model

Last updated: 2026-05-12.

## Core Tables

- `clinics`
- `clinic_staff`
- `owners`
- `owner_channel_identities`
- `pets`
- `requests`
- `messages`
- `attachments`
- `message_delivery_events`
- `internal_notes`
- `request_events`
- `ai_outputs`
- `reminders`
- `notification_templates`
- `consents`
- `pms_exports`
- `audit_logs`
- `clinic_channels`
- `staff_presence`

## Invariants

- Every tenant-owned table includes `clinic_id`.
- RLS is enabled for all domain tables and checks active `clinic_staff` membership.
- `requests.status` is workflow-only: `new`, `waiting_staff`, `waiting_owner`, `resolved`.
- Urgent is an inbox view derived from `requests.urgency = high`, not a persisted status.
- `requests.urgency` is staff-confirmed.
- AI may write `urgency_suggestion` or `risk_flags_json`, but not final urgency.
- Attachments live in `attachments`; do not duplicate attachment state in `messages`.
- `request_events` is the case timeline source of truth.
- `ai_outputs` is the AI accountability source of truth.
- `message_delivery_events` is the outbound delivery source of truth.

## AI Memory V1

- AI memory uses existing request data and `ai_outputs`; it is derived context, not a medical record or PMS replacement.
- `ai_memory_items` stores staff-reviewable memory candidates and accepted memory for `request`, `pet`, and `owner` scopes.
- `ai_memory_sources` links each memory item back to source rows so audit, export, and erasure flows can trace derived data.
- `ai_outputs.kind = memory_extraction` stores extracted, source-grounded candidate facts.
- `ai_outputs.kind = context_retrieval` stores the accepted memory selected for a specific AI task.
- `ai_outputs.kind = reply_draft` stores on-demand drafts and records `source_locale`, `target_locale`, context retrieval output ID, and memory IDs in `input_json`.
- Memory is scoped to one `clinic_id`; retrieval for V1 is limited to the active request plus its linked pet and owner.
- Cross-clinic retrieval is prohibited.
- Status values are `candidate`, `accepted`, `rejected`, and `expired`.
- Accepted retrieval excludes expired and soft-deleted memory.
- RLS allows active clinic members to read; candidate review/update is limited to roles with request-management write rights.

## Soft Delete and Erasure

Owner and pet data must support GDPR erasure while retaining non-PII operational/audit structure where legally required. AI memory is derived data and must be exported, redacted, expired, or deleted consistently with its source records before pilot go-live.
