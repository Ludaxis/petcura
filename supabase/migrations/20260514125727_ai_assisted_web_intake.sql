-- AI-assisted clinic web intake v1.
-- Public owner chat uses server-side APIs only; anonymous clients never read
-- tenant tables directly. AI writes advisory output, not final assignment,
-- urgency, diagnosis, prescription, or medical advice.

create table if not exists public.clinic_web_intake_configs (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  enabled boolean not null default true,
  ai_enabled boolean not null default true,
  allowed_origins text[] not null default '{}'::text[],
  default_locale text not null default 'en'
    check (default_locale in ('en', 'et', 'ru')),
  widget_copy_i18n jsonb not null default '{}'::jsonb,
  rate_limit_per_hour integer not null default 20
    check (rate_limit_per_hour between 1 and 240),
  retention_days integer not null default 30
    check (retention_days between 1 and 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinic_hours (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinic_holidays (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  holiday_date date not null,
  name text,
  is_closed boolean not null default true,
  opens_at time,
  closes_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, holiday_date)
);

create table if not exists public.clinic_emergency_policies (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  is_enabled boolean not null default true,
  emergency_phone text,
  after_hours_phone text,
  emergency_url text,
  instructions_i18n jsonb not null default '{}'::jsonb,
  after_hours_instructions_i18n jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.web_intake_sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  public_token_hash text not null unique,
  owner_id uuid references public.owners(id) on delete set null,
  request_id uuid references public.requests(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'submitted', 'closed', 'expired')),
  locale text not null default 'en' check (locale in ('en', 'et', 'ru')),
  consented_at timestamptz,
  origin text,
  referrer text,
  ip_hash text,
  user_agent_hash text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.requests
  add column if not exists routing_suggestion text,
  add column if not exists service_intent text,
  add column if not exists intake_ai_output_id uuid references public.ai_outputs(id) on delete set null,
  add column if not exists web_intake_session_id uuid references public.web_intake_sessions(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'requests_routing_suggestion_check'
      and conrelid = 'public.requests'::regclass
  ) then
    alter table public.requests
      add constraint requests_routing_suggestion_check
      check (
        routing_suggestion is null
        or routing_suggestion in (
          'reception',
          'vet',
          'tech',
          'grooming',
          'on_call',
          'general'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'requests_service_intent_check'
      and conrelid = 'public.requests'::regclass
  ) then
    alter table public.requests
      add constraint requests_service_intent_check
      check (
        service_intent is null
        or service_intent in (
          'medical',
          'appointment',
          'refill',
          'follow_up',
          'admin',
          'grooming',
          'delivery',
          'walking',
          'boarding',
          'other',
          'unknown'
        )
      );
  end if;
end $$;

create index if not exists clinic_hours_clinic_weekday_idx
  on public.clinic_hours (clinic_id, weekday);
create index if not exists clinic_holidays_clinic_date_idx
  on public.clinic_holidays (clinic_id, holiday_date);
create index if not exists web_intake_sessions_clinic_status_idx
  on public.web_intake_sessions (clinic_id, status, updated_at desc);
create index if not exists web_intake_sessions_request_idx
  on public.web_intake_sessions (request_id)
  where request_id is not null;
create index if not exists requests_web_intake_session_idx
  on public.requests (web_intake_session_id)
  where web_intake_session_id is not null;
create index if not exists requests_routing_suggestion_idx
  on public.requests (clinic_id, routing_suggestion, updated_at desc)
  where routing_suggestion is not null and status <> 'resolved';

drop trigger if exists set_clinic_web_intake_configs_updated_at
  on public.clinic_web_intake_configs;
create trigger set_clinic_web_intake_configs_updated_at
before update on public.clinic_web_intake_configs
for each row execute function public.set_updated_at();

drop trigger if exists set_clinic_hours_updated_at on public.clinic_hours;
create trigger set_clinic_hours_updated_at
before update on public.clinic_hours
for each row execute function public.set_updated_at();

drop trigger if exists set_clinic_holidays_updated_at on public.clinic_holidays;
create trigger set_clinic_holidays_updated_at
before update on public.clinic_holidays
for each row execute function public.set_updated_at();

drop trigger if exists set_clinic_emergency_policies_updated_at
  on public.clinic_emergency_policies;
create trigger set_clinic_emergency_policies_updated_at
before update on public.clinic_emergency_policies
for each row execute function public.set_updated_at();

drop trigger if exists set_web_intake_sessions_updated_at
  on public.web_intake_sessions;
create trigger set_web_intake_sessions_updated_at
before update on public.web_intake_sessions
for each row execute function public.set_updated_at();

alter table public.clinic_web_intake_configs enable row level security;
alter table public.clinic_hours enable row level security;
alter table public.clinic_holidays enable row level security;
alter table public.clinic_emergency_policies enable row level security;
alter table public.web_intake_sessions enable row level security;

drop policy if exists clinic_web_intake_configs_staff_select
  on public.clinic_web_intake_configs;
create policy clinic_web_intake_configs_staff_select
  on public.clinic_web_intake_configs
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists clinic_web_intake_configs_staff_insert
  on public.clinic_web_intake_configs;
create policy clinic_web_intake_configs_staff_insert
  on public.clinic_web_intake_configs
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_web_intake_configs_staff_update
  on public.clinic_web_intake_configs;
create policy clinic_web_intake_configs_staff_update
  on public.clinic_web_intake_configs
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_hours_staff_select on public.clinic_hours;
create policy clinic_hours_staff_select
  on public.clinic_hours
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists clinic_hours_staff_insert on public.clinic_hours;
create policy clinic_hours_staff_insert
  on public.clinic_hours
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_hours_staff_update on public.clinic_hours;
create policy clinic_hours_staff_update
  on public.clinic_hours
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_hours_staff_delete on public.clinic_hours;
create policy clinic_hours_staff_delete
  on public.clinic_hours
  for delete to authenticated
  using (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_holidays_staff_select on public.clinic_holidays;
create policy clinic_holidays_staff_select
  on public.clinic_holidays
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists clinic_holidays_staff_insert on public.clinic_holidays;
create policy clinic_holidays_staff_insert
  on public.clinic_holidays
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_holidays_staff_update on public.clinic_holidays;
create policy clinic_holidays_staff_update
  on public.clinic_holidays
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_holidays_staff_delete on public.clinic_holidays;
create policy clinic_holidays_staff_delete
  on public.clinic_holidays
  for delete to authenticated
  using (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_emergency_policies_staff_select
  on public.clinic_emergency_policies;
create policy clinic_emergency_policies_staff_select
  on public.clinic_emergency_policies
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists clinic_emergency_policies_staff_insert
  on public.clinic_emergency_policies;
create policy clinic_emergency_policies_staff_insert
  on public.clinic_emergency_policies
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists clinic_emergency_policies_staff_update
  on public.clinic_emergency_policies;
create policy clinic_emergency_policies_staff_update
  on public.clinic_emergency_policies
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists web_intake_sessions_staff_select
  on public.web_intake_sessions;
create policy web_intake_sessions_staff_select
  on public.web_intake_sessions
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists web_intake_sessions_staff_insert
  on public.web_intake_sessions;
create policy web_intake_sessions_staff_insert
  on public.web_intake_sessions
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists web_intake_sessions_staff_update
  on public.web_intake_sessions;
create policy web_intake_sessions_staff_update
  on public.web_intake_sessions
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

revoke all on public.clinic_web_intake_configs from anon;
revoke all on public.clinic_hours from anon;
revoke all on public.clinic_holidays from anon;
revoke all on public.clinic_emergency_policies from anon;
revoke all on public.web_intake_sessions from anon;

grant select, insert, update, delete on public.clinic_web_intake_configs
  to authenticated;
grant select, insert, update, delete on public.clinic_hours
  to authenticated;
grant select, insert, update, delete on public.clinic_holidays
  to authenticated;
grant select, insert, update, delete on public.clinic_emergency_policies
  to authenticated;
grant select, insert, update on public.web_intake_sessions
  to authenticated;

grant all on public.clinic_web_intake_configs to service_role;
grant all on public.clinic_hours to service_role;
grant all on public.clinic_holidays to service_role;
grant all on public.clinic_emergency_policies to service_role;
grant all on public.web_intake_sessions to service_role;

insert into public.clinic_web_intake_configs (clinic_id)
select id from public.clinics
on conflict (clinic_id) do nothing;

insert into public.clinic_emergency_policies (clinic_id)
select id from public.clinics
on conflict (clinic_id) do nothing;
