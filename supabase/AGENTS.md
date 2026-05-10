# Supabase Rules

- Every tenant-owned table must include `clinic_id`.
- RLS is mandatory for all domain tables.
- Migrations must be reversible or documented with rollback notes.
- Never weaken policies to make tests pass.
- Seed data must not include real owner or clinic PII.
- Use `request_events` for timeline history and `audit_logs` for staff/system accountability.
- Use `ai_outputs` for all persisted AI input/output accountability.
