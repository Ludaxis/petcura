-- Reminder v1 contract hardening.
-- The base table already exists from the initial schema; this migration adds
-- the indexes and type guard used by the request-detail creation flow and
-- the tenant-scoped /reminders worklist.

do $$ begin
  alter table public.reminders
    add constraint reminders_type_check
    check (type in ('follow_up', 'recheck', 'vaccination', 'refill'));
exception
  when duplicate_object then null;
end $$;

create index if not exists reminders_clinic_status_due_idx
  on public.reminders (clinic_id, status, due_at asc);

create index if not exists reminders_request_due_idx
  on public.reminders (clinic_id, request_id, due_at desc)
  where request_id is not null;
