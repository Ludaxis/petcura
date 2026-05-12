alter table public.clinic_staff
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists archive_reason text;
create index if not exists clinic_staff_active_idx
  on public.clinic_staff (clinic_id, is_active, created_at);
create index if not exists clinic_staff_archived_idx
  on public.clinic_staff (clinic_id, archived_at desc)
  where is_active = false;
create index if not exists audit_logs_actor_time_idx
  on public.audit_logs (clinic_id, actor_id, created_at desc);
create index if not exists audit_logs_entity_time_idx
  on public.audit_logs (clinic_id, entity_type, entity_id, created_at desc);
create index if not exists request_events_actor_time_idx
  on public.request_events (clinic_id, actor_type, actor_id, created_at desc);
comment on column public.clinic_staff.archived_at is
  'When staff access was archived/deactivated. Archived staff are retained for audit history and cannot access clinic data.';
comment on column public.clinic_staff.archived_by is
  'Auth user who archived the staff membership.';
comment on column public.clinic_staff.archive_reason is
  'Short operational reason for archiving staff access.';
