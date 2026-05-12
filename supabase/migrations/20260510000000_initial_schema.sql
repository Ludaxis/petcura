-- PetCura initial schema for hosted Supabase.
-- Final urgency is staff-owned; AI writes suggestions and risk flags only.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.staff_role as enum ('owner', 'admin', 'vet', 'tech', 'reception', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_category as enum ('medical_question', 'refill', 'appointment', 'follow_up', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum ('new', 'waiting_staff', 'waiting_owner', 'resolved');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_urgency as enum ('low', 'medium', 'high');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_sender_type as enum ('owner', 'staff', 'system', 'ai');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.owner_channel as enum ('whatsapp', 'sms', 'web');
exception
  when duplicate_object then null;
end $$;

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'active_clinic_id', '')::uuid
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text not null default 'EE',
  timezone text not null default 'Europe/Tallinn',
  locale text not null default 'en',
  branding_json jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_staff (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.staff_role not null default 'reception',
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  phone text not null,
  name text,
  email text,
  preferred_language text not null default 'en',
  notes text,
  gdpr_consent_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, phone)
);

create table if not exists public.owner_channel_identities (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  channel public.owner_channel not null,
  external_id text not null,
  is_primary boolean not null default false,
  consented_at timestamptz,
  opted_out_at timestamptz,
  created_at timestamptz not null default now(),
  unique (clinic_id, channel, external_id)
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  sex text,
  birth_date date,
  weight_kg numeric(6,2),
  allergies text,
  medical_notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete restrict,
  pet_id uuid references public.pets(id) on delete set null,
  category public.request_category not null,
  status public.request_status not null default 'new',
  urgency public.request_urgency not null default 'low',
  urgency_suggestion public.request_urgency,
  risk_flags_json jsonb not null default '[]'::jsonb,
  assigned_staff_id uuid references public.clinic_staff(id) on delete set null,
  channel public.owner_channel not null default 'web',
  ai_summary text,
  ai_summary_translations_json jsonb not null default '{}'::jsonb,
  ai_summary_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  sla_due_at timestamptz
);

create trigger set_requests_updated_at
before update on public.requests
for each row
execute function public.set_updated_at();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  sender_type public.message_sender_type not null,
  sender_id uuid,
  body text not null,
  body_translated text,
  source_locale text,
  external_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.message_delivery_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  channel public.owner_channel not null,
  status text not null check (status in ('queued', 'sent', 'delivered', 'read', 'acknowledged', 'failed')),
  provider text,
  external_event_id text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create table if not exists public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  actor_type text not null check (actor_type in ('owner', 'staff', 'system', 'ai')),
  actor_id uuid,
  event_type text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  request_id uuid references public.requests(id) on delete cascade,
  kind text not null,
  model text not null,
  prompt_version text not null,
  input_json jsonb not null,
  output_json jsonb not null,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer,
  confidence numeric(4,3),
  reviewed_by uuid references auth.users(id) on delete set null,
  accepted boolean,
  edited_output_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  request_id uuid references public.requests(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  due_at timestamptz not null,
  channel public.owner_channel not null default 'whatsapp',
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'acknowledged', 'completed', 'missed', 'cancelled')),
  sent_at timestamptz,
  acknowledged_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_channels (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  channel public.owner_channel not null,
  external_id text not null,
  display_name text,
  settings_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (clinic_id, channel, external_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  ip inet,
  user_agent text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists requests_inbox_idx on public.requests (clinic_id, status, urgency, updated_at desc);
create index if not exists requests_assignee_open_idx on public.requests (clinic_id, assigned_staff_id) where status <> 'resolved';
create index if not exists messages_request_time_idx on public.messages (request_id, created_at);
create index if not exists request_events_request_time_idx on public.request_events (request_id, created_at);
create index if not exists reminders_scheduled_idx on public.reminders (clinic_id, status, due_at) where status = 'scheduled';
create index if not exists ai_outputs_request_kind_idx on public.ai_outputs (request_id, kind, created_at desc);

alter table public.clinics enable row level security;
alter table public.clinic_staff enable row level security;
alter table public.owners enable row level security;
alter table public.owner_channel_identities enable row level security;
alter table public.pets enable row level security;
alter table public.requests enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.message_delivery_events enable row level security;
alter table public.internal_notes enable row level security;
alter table public.request_events enable row level security;
alter table public.ai_outputs enable row level security;
alter table public.reminders enable row level security;
alter table public.clinic_channels enable row level security;
alter table public.audit_logs enable row level security;

create policy clinics_isolation on public.clinics
  using (id = public.current_clinic_id());

create policy clinic_staff_isolation on public.clinic_staff
  using (clinic_id = public.current_clinic_id());

create policy owners_isolation on public.owners
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy owner_channel_identities_isolation on public.owner_channel_identities
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy pets_isolation on public.pets
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy requests_isolation on public.requests
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy messages_isolation on public.messages
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy attachments_isolation on public.attachments
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy message_delivery_events_isolation on public.message_delivery_events
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy internal_notes_isolation on public.internal_notes
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy request_events_isolation on public.request_events
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy ai_outputs_isolation on public.ai_outputs
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy reminders_isolation on public.reminders
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy clinic_channels_isolation on public.clinic_channels
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy audit_logs_isolation on public.audit_logs
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());
