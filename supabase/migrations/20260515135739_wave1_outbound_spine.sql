-- Wave 1 backend pilot spine:
-- durable outbound outbox, provider delivery attempts, and async Twilio media
-- ingestion state. Rollback: drop the new indexes/policies/tables and remove
-- the additive attachment columns after draining queued work.

create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  request_id uuid references public.requests(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  reminder_id uuid references public.reminders(id) on delete set null,
  owner_id uuid references public.owners(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  fallback_of_outbound_message_id uuid references public.outbound_messages(id) on delete set null,
  source text not null check (source in ('staff_reply', 'reminder', 'sms_fallback')),
  channel public.owner_channel not null check (channel in ('whatsapp', 'sms')),
  provider text not null default 'twilio',
  recipient_phone text not null,
  body text not null,
  status text not null default 'queued' check (
    status in ('queued', 'sending', 'dispatched', 'delivered', 'read', 'failed', 'cancelled')
  ),
  idempotency_key text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_outbound_messages_updated_at
  on public.outbound_messages;
create trigger set_outbound_messages_updated_at
before update on public.outbound_messages
for each row
execute function public.set_updated_at();

create table if not exists public.message_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  outbound_message_id uuid not null references public.outbound_messages(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  request_id uuid references public.requests(id) on delete cascade,
  channel public.owner_channel not null check (channel in ('whatsapp', 'sms')),
  provider text not null default 'twilio',
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'sending' check (
    status in ('queued', 'sending', 'sent', 'delivered', 'read', 'acknowledged', 'failed')
  ),
  provider_message_sid text,
  provider_status text,
  error_code text,
  error_message text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  completed_at timestamptz,
  unique (outbound_message_id, attempt_number),
  unique (provider, provider_message_sid)
);

alter table public.attachments
  add column if not exists provider text,
  add column if not exists provider_media_id text,
  add column if not exists ingestion_status text not null default 'completed'
    check (ingestion_status in ('queued', 'processing', 'completed', 'failed', 'skipped')),
  add column if not exists ingestion_attempts integer not null default 0 check (ingestion_attempts >= 0),
  add column if not exists ingestion_error text,
  add column if not exists ingestion_queued_at timestamptz,
  add column if not exists ingestion_completed_at timestamptz;

create unique index if not exists outbound_messages_clinic_idempotency_idx
  on public.outbound_messages (clinic_id, idempotency_key);

create unique index if not exists outbound_messages_sms_fallback_once_idx
  on public.outbound_messages (fallback_of_outbound_message_id)
  where channel = 'sms' and fallback_of_outbound_message_id is not null;

create index if not exists outbound_messages_worker_idx
  on public.outbound_messages (status, next_attempt_at, created_at)
  where status in ('queued', 'failed');

create index if not exists outbound_messages_request_idx
  on public.outbound_messages (clinic_id, request_id, created_at desc)
  where request_id is not null;

create index if not exists message_delivery_attempts_sid_idx
  on public.message_delivery_attempts (provider, provider_message_sid)
  where provider_message_sid is not null;

create index if not exists message_delivery_attempts_outbound_idx
  on public.message_delivery_attempts (clinic_id, outbound_message_id, created_at desc);

create index if not exists attachments_twilio_ingestion_idx
  on public.attachments (clinic_id, ingestion_status, created_at)
  where provider = 'twilio';

create table if not exists public.twilio_media_ingestion_jobs (
  attachment_id uuid primary key references public.attachments(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  provider_url text not null,
  provider_media_id text,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed', 'skipped')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_twilio_media_ingestion_jobs_updated_at
  on public.twilio_media_ingestion_jobs;
create trigger set_twilio_media_ingestion_jobs_updated_at
before update on public.twilio_media_ingestion_jobs
for each row
execute function public.set_updated_at();

create index if not exists twilio_media_ingestion_jobs_status_idx
  on public.twilio_media_ingestion_jobs (clinic_id, status, created_at);

alter table public.twilio_media_ingestion_jobs enable row level security;

revoke all on public.twilio_media_ingestion_jobs from public, anon, authenticated;
grant all on public.twilio_media_ingestion_jobs to service_role;

alter table public.outbound_messages enable row level security;
alter table public.message_delivery_attempts enable row level security;

drop policy if exists outbound_messages_select_isolation on public.outbound_messages;
drop policy if exists outbound_messages_insert_write on public.outbound_messages;
drop policy if exists outbound_messages_update_write on public.outbound_messages;
drop policy if exists message_delivery_attempts_select_isolation on public.message_delivery_attempts;
drop policy if exists message_delivery_attempts_insert_write on public.message_delivery_attempts;
drop policy if exists message_delivery_attempts_update_write on public.message_delivery_attempts;

create policy outbound_messages_select_isolation on public.outbound_messages
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

create policy outbound_messages_insert_write on public.outbound_messages
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

create policy outbound_messages_update_write on public.outbound_messages
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

create policy message_delivery_attempts_select_isolation on public.message_delivery_attempts
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

create policy message_delivery_attempts_insert_write on public.message_delivery_attempts
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

create policy message_delivery_attempts_update_write on public.message_delivery_attempts
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

revoke all on public.outbound_messages from anon;
revoke all on public.message_delivery_attempts from anon;
grant select, insert, update on public.outbound_messages to authenticated;
grant select, insert, update on public.message_delivery_attempts to authenticated;
grant all on public.outbound_messages to service_role;
grant all on public.message_delivery_attempts to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'outbound_messages'
  ) then
    alter publication supabase_realtime add table public.outbound_messages;
  end if;
end $$;

alter table public.outbound_messages replica identity full;

comment on table public.twilio_media_ingestion_jobs is
  'Service-only Twilio media download URLs for async ingestion. Provider URLs must not live in owner-readable attachment rows.';
