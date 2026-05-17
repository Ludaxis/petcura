create extension if not exists btree_gist;

create extension if not exists btree_gist with schema extensions;

create or replace function private.can_manage_appointments(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select coalesce(
    private.active_staff_role(target_clinic_id) in ('owner', 'admin', 'vet', 'reception'),
    false
  )
$$;

create or replace function private.can_manage_availability(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select coalesce(
    private.active_staff_role(target_clinic_id) in ('owner', 'admin'),
    false
  )
$$;

revoke all on function private.can_manage_appointments(uuid) from public;
revoke all on function private.can_manage_availability(uuid) from public;
grant execute on function private.can_manage_appointments(uuid) to authenticated, service_role;
grant execute on function private.can_manage_availability(uuid) to authenticated, service_role;

alter table public.outbound_messages
  drop constraint if exists outbound_messages_source_check;
alter table public.outbound_messages
  add constraint outbound_messages_source_check
  check (source in ('staff_reply', 'appointment_offer', 'reminder', 'sms_fallback'));

alter table public.ai_output_sources
  drop constraint if exists ai_output_sources_source_type_check;
alter table public.ai_output_sources
  add constraint ai_output_sources_source_type_check
  check (
    source_type in (
      'request',
      'message',
      'internal_note',
      'ai_output',
      'ai_memory_item',
      'owner',
      'pet',
      'appointment',
      'appointment_slot_offer',
      'service',
      'web_intake_session'
    )
  );

create table if not exists public.staff_availability_rules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  staff_id uuid not null references public.clinic_staff(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  service_ids uuid[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

create index if not exists staff_availability_rules_clinic_weekday
  on public.staff_availability_rules (clinic_id, weekday, is_active);
create index if not exists staff_availability_rules_staff
  on public.staff_availability_rules (clinic_id, staff_id, weekday);

drop trigger if exists set_staff_availability_rules_updated_at on public.staff_availability_rules;
create trigger set_staff_availability_rules_updated_at
before update on public.staff_availability_rules
for each row
execute function public.set_updated_at();

create table if not exists public.staff_time_off (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  staff_id uuid not null references public.clinic_staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create index if not exists staff_time_off_staff_range
  on public.staff_time_off (clinic_id, staff_id, starts_at, ends_at);

drop trigger if exists set_staff_time_off_updated_at on public.staff_time_off;
create trigger set_staff_time_off_updated_at
before update on public.staff_time_off
for each row
execute function public.set_updated_at();

create table if not exists public.appointment_slot_offers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  request_id uuid references public.requests(id) on delete set null,
  offered_by_staff_id uuid references public.clinic_staff(id) on delete set null,
  status text not null default 'sent' check (status in ('draft', 'sent', 'accepted', 'expired', 'cancelled')),
  slots_json jsonb not null default '[]'::jsonb,
  message_id uuid references public.messages(id) on delete set null,
  expires_at timestamptz not null default now() + interval '10 minutes',
  accepted_slot_index int check (accepted_slot_index is null or accepted_slot_index between 0 and 2),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, appointment_id) references public.appointments(clinic_id, id),
  foreign key (clinic_id, request_id) references public.requests(clinic_id, id)
);

create index if not exists appointment_slot_offers_request
  on public.appointment_slot_offers (clinic_id, request_id, created_at desc);
create index if not exists appointment_slot_offers_active
  on public.appointment_slot_offers (clinic_id, appointment_id, status, expires_at)
  where status in ('sent', 'draft');

drop trigger if exists set_appointment_slot_offers_updated_at on public.appointment_slot_offers;
create trigger set_appointment_slot_offers_updated_at
before update on public.appointment_slot_offers
for each row
execute function public.set_updated_at();

create table if not exists public.appointment_holds (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  offer_id uuid references public.appointment_slot_offers(id) on delete cascade,
  staff_id uuid not null references public.clinic_staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'held' check (status in ('held', 'confirmed', 'expired', 'released')),
  expires_at timestamptz not null default now() + interval '10 minutes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  foreign key (clinic_id, appointment_id) references public.appointments(clinic_id, id)
);

create index if not exists appointment_holds_staff_range
  on public.appointment_holds (clinic_id, staff_id, starts_at, ends_at);
create index if not exists appointment_holds_offer
  on public.appointment_holds (clinic_id, offer_id);

drop trigger if exists set_appointment_holds_updated_at on public.appointment_holds;
create trigger set_appointment_holds_updated_at
before update on public.appointment_holds
for each row
execute function public.set_updated_at();

create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  request_id uuid references public.requests(id) on delete set null,
  actor_type text not null check (actor_type in ('owner', 'staff', 'system', 'ai')),
  actor_id uuid,
  event_type text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (clinic_id, appointment_id) references public.appointments(clinic_id, id),
  foreign key (clinic_id, request_id) references public.requests(clinic_id, id)
);

create index if not exists appointment_events_timeline
  on public.appointment_events (clinic_id, appointment_id, created_at desc);

do $$
begin
  alter table public.appointments add constraint appointments_no_staff_overlap
    exclude using gist (
      clinic_id with =,
      staff_id with =,
      tstzrange(
        scheduled_at,
        scheduled_at + make_interval(mins => coalesce(duration_minutes, 30)),
        '[)'
      ) with &&
    )
    where (
      status in ('confirmed', 'rescheduled')
      and scheduled_at is not null
      and staff_id is not null
    );
exception
  when duplicate_object then null;
end $$;

drop policy if exists appointments_staff_insert on public.appointments;
drop policy if exists appointments_staff_update on public.appointments;
drop policy if exists appointments_staff_delete on public.appointments;

alter table public.staff_availability_rules enable row level security;
alter table public.staff_time_off enable row level security;
alter table public.appointment_slot_offers enable row level security;
alter table public.appointment_holds enable row level security;
alter table public.appointment_events enable row level security;

create policy staff_availability_rules_staff_select on public.staff_availability_rules
  for select to authenticated using (public.is_active_clinic_member(clinic_id));
drop policy if exists staff_availability_rules_staff_write on public.staff_availability_rules;

create policy staff_time_off_staff_select on public.staff_time_off
  for select to authenticated using (public.is_active_clinic_member(clinic_id));
drop policy if exists staff_time_off_staff_write on public.staff_time_off;

create policy appointment_slot_offers_staff_select on public.appointment_slot_offers
  for select to authenticated using (public.is_active_clinic_member(clinic_id));
create policy appointment_slot_offers_owner_select on public.appointment_slot_offers
  for select to authenticated using (
    exists (
      select 1
      from public.appointments
      where appointments.clinic_id = appointment_slot_offers.clinic_id
        and appointments.id = appointment_slot_offers.appointment_id
        and appointments.owner_id = private.current_owner_id_for_clinic(appointment_slot_offers.clinic_id)
    )
  );
drop policy if exists appointment_slot_offers_staff_write on public.appointment_slot_offers;

create policy appointment_holds_staff_select on public.appointment_holds
  for select to authenticated using (public.is_active_clinic_member(clinic_id));
create policy appointment_holds_owner_select on public.appointment_holds
  for select to authenticated using (
    exists (
      select 1
      from public.appointments
      where appointments.clinic_id = appointment_holds.clinic_id
        and appointments.id = appointment_holds.appointment_id
        and appointments.owner_id = private.current_owner_id_for_clinic(appointment_holds.clinic_id)
    )
  );
drop policy if exists appointment_holds_staff_write on public.appointment_holds;

create policy appointment_events_staff_select on public.appointment_events
  for select to authenticated using (public.is_active_clinic_member(clinic_id));
create policy appointment_events_owner_select on public.appointment_events
  for select to authenticated using (
    exists (
      select 1
      from public.appointments
      where appointments.clinic_id = appointment_events.clinic_id
        and appointments.id = appointment_events.appointment_id
        and appointments.owner_id = private.current_owner_id_for_clinic(appointment_events.clinic_id)
    )
  );
drop policy if exists appointment_events_staff_insert on public.appointment_events;

grant select on public.staff_availability_rules to authenticated;
grant select on public.staff_time_off to authenticated;
grant select on public.appointment_slot_offers to authenticated;
grant select on public.appointment_holds to authenticated;
grant select on public.appointment_events to authenticated;
grant all on public.staff_availability_rules to service_role;
grant all on public.staff_time_off to service_role;
grant all on public.appointment_slot_offers to service_role;
grant all on public.appointment_holds to service_role;
grant all on public.appointment_events to service_role;

alter table public.staff_availability_rules replica identity full;
alter table public.staff_time_off replica identity full;
alter table public.appointment_slot_offers replica identity full;
alter table public.appointment_holds replica identity full;
alter table public.appointment_events replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.appointments;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.staff_availability_rules;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.staff_time_off;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.appointment_slot_offers;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.appointment_holds;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.appointment_events;
exception when duplicate_object then null;
end $$;
