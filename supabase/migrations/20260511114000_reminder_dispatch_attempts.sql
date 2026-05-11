alter table public.reminders
  add column if not exists send_attempts integer not null default 0,
  add column if not exists last_send_attempt_at timestamptz,
  add column if not exists last_send_error text,
  add column if not exists last_delivery_message_id uuid references public.messages(id) on delete set null;

do $$ begin
  alter table public.reminders
    add constraint reminders_send_attempts_non_negative
    check (send_attempts >= 0);
exception
  when duplicate_object then null;
end $$;

create index if not exists reminders_dispatch_due_idx
  on public.reminders (clinic_id, due_at, last_send_attempt_at)
  where status = 'scheduled';
