-- Owner PWA foundation: owner auth links, owner-readable data, services, and
-- appointment requests.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

do $$ begin
  create type public.service_category as enum (
    'checkup',
    'vaccination',
    'refill',
    'grooming',
    'consultation',
    'surgery',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum (
    'requested',
    'confirmed',
    'rescheduled',
    'completed',
    'cancelled',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.pets
  add column if not exists owner_notes text;

alter table public.reminders
  add column if not exists source_key text;

create unique index if not exists reminders_source_key_unique
  on public.reminders (clinic_id, type, source_key)
  where source_key is not null;

do $$ begin
  alter table public.owners
    add constraint owners_clinic_id_id_key unique (clinic_id, id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table public.pets
    add constraint pets_clinic_id_id_key unique (clinic_id, id);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table public.requests
    add constraint requests_clinic_id_id_key unique (clinic_id, id);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.owner_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_user_identities (
  user_id uuid not null references public.owner_users(user_id) on delete cascade,
  identity_type text not null check (identity_type in ('phone', 'email')),
  identity_value text not null,
  created_at timestamptz not null default now(),
  primary key (identity_type, identity_value)
);

create table if not exists public.owner_user_memberships (
  user_id uuid not null references public.owner_users(user_id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, clinic_id),
  foreign key (clinic_id, owner_id) references public.owners(clinic_id, id)
);

create table if not exists public.owner_invites (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  phone text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_by_staff_id uuid references public.clinic_staff(id),
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  slug text not null,
  category public.service_category not null,
  name_i18n jsonb not null,
  description_i18n jsonb not null default '{}'::jsonb,
  duration_minutes int not null check (duration_minutes > 0),
  price_cents int,
  currency char(3) not null default 'EUR' check (currency = upper(currency)),
  requires_pet_species text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, slug),
  unique (clinic_id, id)
);

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

create index if not exists services_clinic_active
  on public.services (clinic_id, is_active, sort_order);

create table if not exists public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid not null,
  vaccine_code text not null,
  vaccine_name text not null,
  administered_at date not null,
  next_due_at date,
  lot_number text,
  manufacturer text,
  administered_by_staff_id uuid references public.clinic_staff(id),
  notes text,
  source text not null default 'staff'
    check (source in ('staff', 'pms_import', 'owner_attested')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, pet_id) references public.pets(clinic_id, id)
);

drop trigger if exists set_vaccinations_updated_at on public.vaccinations;
create trigger set_vaccinations_updated_at
before update on public.vaccinations
for each row
execute function public.set_updated_at();

create index if not exists vaccinations_pet
  on public.vaccinations (pet_id, administered_at desc);
create index if not exists vaccinations_clinic_due
  on public.vaccinations (clinic_id, next_due_at)
  where next_due_at is not null;

create table if not exists public.pet_weight_entries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  pet_id uuid not null,
  weight_kg numeric(5,2) not null check (weight_kg > 0 and weight_kg < 200),
  measured_at date not null,
  source text not null check (source in ('owner', 'staff')),
  created_by uuid,
  created_at timestamptz not null default now(),
  foreign key (clinic_id, pet_id) references public.pets(clinic_id, id)
);

create index if not exists pet_weight_entries_pet
  on public.pet_weight_entries (pet_id, measured_at desc, created_at desc);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  owner_id uuid not null,
  pet_id uuid not null,
  service_id uuid,
  request_id uuid,
  proposed_window tstzrange not null,
  scheduled_at timestamptz,
  duration_minutes int,
  staff_id uuid references public.clinic_staff(id),
  status public.appointment_status not null default 'requested',
  notes text,
  cancelled_reason text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, owner_id) references public.owners(clinic_id, id),
  foreign key (clinic_id, pet_id) references public.pets(clinic_id, id),
  foreign key (clinic_id, service_id) references public.services(clinic_id, id),
  foreign key (clinic_id, request_id) references public.requests(clinic_id, id)
);

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

create unique index if not exists appointments_idem
  on public.appointments (clinic_id, owner_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists appointments_owner_created
  on public.appointments (clinic_id, owner_id, created_at desc);
create index if not exists appointments_request
  on public.appointments (clinic_id, request_id)
  where request_id is not null;

create or replace function public.sync_pet_latest_weight()
returns trigger
language plpgsql
as $$
declare
  target_pet_id uuid;
  target_clinic_id uuid;
  latest_weight numeric(5,2);
begin
  target_pet_id = coalesce(new.pet_id, old.pet_id);
  target_clinic_id = coalesce(new.clinic_id, old.clinic_id);

  select weight_kg
  into latest_weight
  from public.pet_weight_entries
  where clinic_id = target_clinic_id
    and pet_id = target_pet_id
  order by measured_at desc, created_at desc
  limit 1;

  update public.pets
  set weight_kg = latest_weight
  where clinic_id = target_clinic_id
    and id = target_pet_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_pet_latest_weight_after_insert on public.pet_weight_entries;
create trigger sync_pet_latest_weight_after_insert
after insert on public.pet_weight_entries
for each row
execute function public.sync_pet_latest_weight();

drop trigger if exists sync_pet_latest_weight_after_update on public.pet_weight_entries;
create trigger sync_pet_latest_weight_after_update
after update on public.pet_weight_entries
for each row
execute function public.sync_pet_latest_weight();

drop trigger if exists sync_pet_latest_weight_after_delete on public.pet_weight_entries;
create trigger sync_pet_latest_weight_after_delete
after delete on public.pet_weight_entries
for each row
execute function public.sync_pet_latest_weight();

alter table public.owner_users enable row level security;
alter table public.owner_user_identities enable row level security;
alter table public.owner_user_memberships enable row level security;
alter table public.owner_invites enable row level security;
alter table public.services enable row level security;
alter table public.vaccinations enable row level security;
alter table public.pet_weight_entries enable row level security;
alter table public.appointments enable row level security;

create or replace function private.is_owner_actor()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'petcura_actor',
    auth.jwt() ->> 'petcura_actor',
    ''
  ) = 'owner'
$$;

create or replace function private.current_owner_id_for_clinic(target_clinic_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select case
    when not private.is_owner_actor() then null
    else (
      select owner_user_memberships.owner_id
      from public.owner_user_memberships
      where owner_user_memberships.user_id = auth.uid()
        and owner_user_memberships.clinic_id = target_clinic_id
      limit 1
    )
  end
$$;

create or replace function private.is_owner_member_of_clinic(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select private.current_owner_id_for_clinic(target_clinic_id) is not null
$$;

create or replace function private.can_manage_services(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select coalesce(private.active_staff_role(target_clinic_id) in ('owner', 'admin'), false)
$$;

create or replace function public.is_active_clinic_member(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select case
    when private.is_owner_actor() then false
    else exists (
      select 1
      from public.clinic_staff
      where clinic_staff.clinic_id = target_clinic_id
        and clinic_staff.user_id = auth.uid()
        and clinic_staff.is_active = true
    )
  end
$$;

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select case
    when private.is_owner_actor() then null
    else coalesce(
      nullif(auth.jwt() ->> 'active_clinic_id', '')::uuid,
      (
        select clinic_staff.clinic_id
        from public.clinic_staff
        where clinic_staff.user_id = auth.uid()
          and clinic_staff.is_active = true
        order by clinic_staff.created_at asc
        limit 1
      )
    )
  end
$$;

revoke all on function private.is_owner_actor() from public;
revoke all on function private.current_owner_id_for_clinic(uuid) from public;
revoke all on function private.is_owner_member_of_clinic(uuid) from public;
revoke all on function private.can_manage_services(uuid) from public;
grant execute on function private.is_owner_actor() to authenticated, service_role;
grant execute on function private.current_owner_id_for_clinic(uuid) to authenticated, service_role;
grant execute on function private.is_owner_member_of_clinic(uuid) to authenticated, service_role;
grant execute on function private.can_manage_services(uuid) to authenticated, service_role;
grant execute on function public.is_active_clinic_member(uuid) to anon, authenticated, service_role;
grant execute on function public.current_clinic_id() to anon, authenticated, service_role;

drop policy if exists owner_users_self_select on public.owner_users;
create policy owner_users_self_select on public.owner_users
  for select to authenticated
  using (private.is_owner_actor() and user_id = (select auth.uid()));

drop policy if exists owner_user_identities_self_select on public.owner_user_identities;
create policy owner_user_identities_self_select on public.owner_user_identities
  for select to authenticated
  using (private.is_owner_actor() and user_id = (select auth.uid()));

drop policy if exists owner_user_memberships_self_select on public.owner_user_memberships;
create policy owner_user_memberships_self_select on public.owner_user_memberships
  for select to authenticated
  using (private.is_owner_actor() and user_id = (select auth.uid()));

drop policy if exists owner_invites_staff_select on public.owner_invites;
create policy owner_invites_staff_select on public.owner_invites
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists owner_invites_staff_insert on public.owner_invites;
create policy owner_invites_staff_insert on public.owner_invites
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists owner_invites_staff_update on public.owner_invites;
create policy owner_invites_staff_update on public.owner_invites
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists clinics_owner_select on public.clinics;
create policy clinics_owner_select on public.clinics
  for select to authenticated
  using (private.is_owner_member_of_clinic(id));

drop policy if exists owners_owner_select on public.owners;
create policy owners_owner_select on public.owners
  for select to authenticated
  using (id = private.current_owner_id_for_clinic(clinic_id));

drop policy if exists pets_owner_select on public.pets;
create policy pets_owner_select on public.pets
  for select to authenticated
  using (
    deleted_at is null
    and owner_id = private.current_owner_id_for_clinic(clinic_id)
  );

drop policy if exists requests_owner_select on public.requests;
create policy requests_owner_select on public.requests
  for select to authenticated
  using (owner_id = private.current_owner_id_for_clinic(clinic_id));

drop policy if exists messages_owner_select on public.messages;
create policy messages_owner_select on public.messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.requests
      where requests.id = messages.request_id
        and requests.clinic_id = messages.clinic_id
        and requests.owner_id = private.current_owner_id_for_clinic(messages.clinic_id)
    )
  );

drop policy if exists attachments_owner_select on public.attachments;
create policy attachments_owner_select on public.attachments
  for select to authenticated
  using (
    exists (
      select 1
      from public.requests
      where requests.id = attachments.request_id
        and requests.clinic_id = attachments.clinic_id
        and requests.owner_id = private.current_owner_id_for_clinic(attachments.clinic_id)
    )
  );

drop policy if exists message_delivery_events_owner_select on public.message_delivery_events;
create policy message_delivery_events_owner_select on public.message_delivery_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.messages
      join public.requests
        on requests.id = messages.request_id
       and requests.clinic_id = messages.clinic_id
      where messages.id = message_delivery_events.message_id
        and messages.clinic_id = message_delivery_events.clinic_id
        and requests.owner_id = private.current_owner_id_for_clinic(message_delivery_events.clinic_id)
    )
  );

drop policy if exists request_events_owner_select on public.request_events;
create policy request_events_owner_select on public.request_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.requests
      where requests.id = request_events.request_id
        and requests.clinic_id = request_events.clinic_id
        and requests.owner_id = private.current_owner_id_for_clinic(request_events.clinic_id)
    )
  );

drop policy if exists reminders_owner_select on public.reminders;
create policy reminders_owner_select on public.reminders
  for select to authenticated
  using (
    exists (
      select 1
      from public.pets
      where pets.id = reminders.pet_id
        and pets.clinic_id = reminders.clinic_id
        and pets.owner_id = private.current_owner_id_for_clinic(reminders.clinic_id)
    )
    or exists (
      select 1
      from public.requests
      where requests.id = reminders.request_id
        and requests.clinic_id = reminders.clinic_id
        and requests.owner_id = private.current_owner_id_for_clinic(reminders.clinic_id)
    )
  );

drop policy if exists services_staff_select on public.services;
create policy services_staff_select on public.services
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists services_owner_select on public.services;
create policy services_owner_select on public.services
  for select to authenticated
  using (is_active and private.is_owner_member_of_clinic(clinic_id));

drop policy if exists services_staff_insert on public.services;
create policy services_staff_insert on public.services
  for insert to authenticated
  with check (private.can_manage_services(clinic_id));

drop policy if exists services_staff_update on public.services;
create policy services_staff_update on public.services
  for update to authenticated
  using (private.can_manage_services(clinic_id))
  with check (private.can_manage_services(clinic_id));

drop policy if exists services_staff_delete on public.services;
create policy services_staff_delete on public.services
  for delete to authenticated
  using (private.can_manage_services(clinic_id));

drop policy if exists vaccinations_staff_select on public.vaccinations;
create policy vaccinations_staff_select on public.vaccinations
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists vaccinations_owner_select on public.vaccinations;
create policy vaccinations_owner_select on public.vaccinations
  for select to authenticated
  using (
    exists (
      select 1
      from public.pets
      where pets.id = vaccinations.pet_id
        and pets.clinic_id = vaccinations.clinic_id
        and pets.owner_id = private.current_owner_id_for_clinic(vaccinations.clinic_id)
        and pets.deleted_at is null
    )
  );

drop policy if exists vaccinations_staff_insert on public.vaccinations;
create policy vaccinations_staff_insert on public.vaccinations
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists vaccinations_staff_update on public.vaccinations;
create policy vaccinations_staff_update on public.vaccinations
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists vaccinations_staff_delete on public.vaccinations;
create policy vaccinations_staff_delete on public.vaccinations
  for delete to authenticated
  using (private.can_write_clinic_data(clinic_id));

drop policy if exists pet_weight_entries_staff_select on public.pet_weight_entries;
create policy pet_weight_entries_staff_select on public.pet_weight_entries
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists pet_weight_entries_owner_select on public.pet_weight_entries;
create policy pet_weight_entries_owner_select on public.pet_weight_entries
  for select to authenticated
  using (
    exists (
      select 1
      from public.pets
      where pets.id = pet_weight_entries.pet_id
        and pets.clinic_id = pet_weight_entries.clinic_id
        and pets.owner_id = private.current_owner_id_for_clinic(pet_weight_entries.clinic_id)
        and pets.deleted_at is null
    )
  );

drop policy if exists pet_weight_entries_staff_insert on public.pet_weight_entries;
create policy pet_weight_entries_staff_insert on public.pet_weight_entries
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id) and source = 'staff');

drop policy if exists pet_weight_entries_owner_insert on public.pet_weight_entries;
create policy pet_weight_entries_owner_insert on public.pet_weight_entries
  for insert to authenticated
  with check (
    private.is_owner_actor()
    and source = 'owner'
    and created_by = (select auth.uid())
    and exists (
      select 1
      from public.pets
      where pets.id = pet_weight_entries.pet_id
        and pets.clinic_id = pet_weight_entries.clinic_id
        and pets.owner_id = private.current_owner_id_for_clinic(pet_weight_entries.clinic_id)
        and pets.deleted_at is null
    )
  );

drop policy if exists pet_weight_entries_staff_update on public.pet_weight_entries;
create policy pet_weight_entries_staff_update on public.pet_weight_entries
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists pet_weight_entries_staff_delete on public.pet_weight_entries;
create policy pet_weight_entries_staff_delete on public.pet_weight_entries
  for delete to authenticated
  using (private.can_write_clinic_data(clinic_id));

drop policy if exists appointments_staff_select on public.appointments;
create policy appointments_staff_select on public.appointments
  for select to authenticated
  using (public.is_active_clinic_member(clinic_id));

drop policy if exists appointments_owner_select on public.appointments;
create policy appointments_owner_select on public.appointments
  for select to authenticated
  using (owner_id = private.current_owner_id_for_clinic(clinic_id));

drop policy if exists appointments_staff_insert on public.appointments;
create policy appointments_staff_insert on public.appointments
  for insert to authenticated
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists appointments_staff_update on public.appointments;
create policy appointments_staff_update on public.appointments
  for update to authenticated
  using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));

drop policy if exists appointments_staff_delete on public.appointments;
create policy appointments_staff_delete on public.appointments
  for delete to authenticated
  using (private.can_write_clinic_data(clinic_id));

grant select on public.owner_users to authenticated;
grant select on public.owner_user_identities to authenticated;
grant select on public.owner_user_memberships to authenticated;
grant select, insert, update on public.owner_invites to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.vaccinations to authenticated;
grant select, insert, update, delete on public.pet_weight_entries to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;

create or replace function private.localized_text(value jsonb, preferred_locale text)
returns text
language sql
immutable
as $$
  select coalesce(
    value ->> preferred_locale,
    value ->> 'en',
    (
      select entry.value
      from jsonb_each_text(value) as entry(key, value)
      order by case when entry.key = 'en' then 0 else 1 end, entry.key
      limit 1
    ),
    ''
  )
$$;

create or replace function private.request_appointment(
  p_pet_id uuid,
  p_service_id uuid,
  p_proposed_window tstzrange,
  p_notes text,
  p_idempotency_key text
) returns uuid
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_user_id uuid;
  v_pet record;
  v_service record;
  v_existing_appointment_id uuid;
  v_request_id uuid;
  v_appointment_id uuid;
  v_message_id uuid;
  v_summary text;
begin
  if not private.is_owner_actor() then
    raise exception 'Owner session required' using errcode = '42501';
  end if;

  v_user_id = auth.uid();
  if v_user_id is null then
    raise exception 'Authenticated session required' using errcode = '42501';
  end if;

  if isempty(p_proposed_window)
     or lower(p_proposed_window) is null
     or upper(p_proposed_window) is null
     or lower(p_proposed_window) < now() - interval '5 minutes'
     or upper(p_proposed_window) <= lower(p_proposed_window) then
    raise exception 'Invalid appointment window' using errcode = '22023';
  end if;

  select
    pets.id,
    pets.clinic_id,
    pets.owner_id,
    pets.name,
    pets.species
  into v_pet
  from public.pets
  join public.owner_user_memberships membership
    on membership.clinic_id = pets.clinic_id
   and membership.owner_id = pets.owner_id
  where pets.id = p_pet_id
    and pets.deleted_at is null
    and membership.user_id = v_user_id
  limit 1;

  if not found then
    raise exception 'Pet is not available to this owner' using errcode = '42501';
  end if;

  select
    services.id,
    services.clinic_id,
    services.name_i18n,
    services.duration_minutes,
    services.requires_pet_species
  into v_service
  from public.services
  where services.id = p_service_id
    and services.clinic_id = v_pet.clinic_id
    and services.is_active = true
  limit 1;

  if not found then
    raise exception 'Service is not available' using errcode = '42501';
  end if;

  if cardinality(v_service.requires_pet_species) > 0
     and not (v_pet.species = any(v_service.requires_pet_species)) then
    raise exception 'Service is not available for this pet species' using errcode = '22023';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select appointments.id
    into v_existing_appointment_id
    from public.appointments
    where appointments.clinic_id = v_pet.clinic_id
      and appointments.owner_id = v_pet.owner_id
      and appointments.idempotency_key = trim(p_idempotency_key)
    limit 1;

    if v_existing_appointment_id is not null then
      return v_existing_appointment_id;
    end if;
  end if;

  if (
    select count(*)
    from public.appointments
    where appointments.clinic_id = v_pet.clinic_id
      and appointments.owner_id = v_pet.owner_id
      and appointments.created_at >= now() - interval '1 day'
  ) >= 5 then
    raise exception 'Appointment request rate limit exceeded' using errcode = '54000';
  end if;

  insert into public.requests (
    clinic_id,
    owner_id,
    pet_id,
    category,
    status,
    urgency,
    channel
  )
  values (
    v_pet.clinic_id,
    v_pet.owner_id,
    v_pet.id,
    'appointment',
    'new',
    'low',
    'web'
  )
  returning id into v_request_id;

  insert into public.appointments (
    clinic_id,
    owner_id,
    pet_id,
    service_id,
    request_id,
    proposed_window,
    duration_minutes,
    notes,
    idempotency_key
  )
  values (
    v_pet.clinic_id,
    v_pet.owner_id,
    v_pet.id,
    v_service.id,
    v_request_id,
    p_proposed_window,
    v_service.duration_minutes,
    nullif(trim(coalesce(p_notes, '')), ''),
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  returning id into v_appointment_id;

  v_summary = concat(
    v_pet.name,
    ' - ',
    private.localized_text(v_service.name_i18n, 'en'),
    '. Proposed: ',
    to_char(lower(p_proposed_window), 'YYYY-MM-DD HH24:MI'),
    ' - ',
    to_char(upper(p_proposed_window), 'HH24:MI')
  );

  insert into public.messages (
    request_id,
    clinic_id,
    sender_type,
    sender_id,
    body,
    source_locale
  )
  values (
    v_request_id,
    v_pet.clinic_id,
    'system',
    null,
    v_summary,
    'en'
  )
  returning id into v_message_id;

  insert into public.request_events (
    request_id,
    clinic_id,
    actor_type,
    actor_id,
    event_type,
    payload_json
  )
  values
    (
      v_request_id,
      v_pet.clinic_id,
      'owner',
      v_pet.owner_id,
      'created',
      jsonb_build_object(
        'category',
        'appointment',
        'channel',
        'web',
        'appointment_id',
        v_appointment_id
      )
    ),
    (
      v_request_id,
      v_pet.clinic_id,
      'owner',
      v_pet.owner_id,
      'appointment_requested',
      jsonb_build_object(
        'appointment_id',
        v_appointment_id,
        'service_id',
        v_service.id,
        'message_id',
        v_message_id,
        'proposed_window',
        p_proposed_window::text
      )
    );

  insert into public.audit_logs (
    clinic_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    payload_json
  )
  values (
    v_pet.clinic_id,
    v_user_id,
    'appointment_requested',
    'appointment',
    v_appointment_id,
    jsonb_build_object(
      'owner_id',
      v_pet.owner_id,
      'pet_id',
      v_pet.id,
      'service_id',
      v_service.id,
      'request_id',
      v_request_id
    )
  );

  return v_appointment_id;
end;
$$;

revoke all on function private.request_appointment(uuid, uuid, tstzrange, text, text) from public;
grant execute on function private.request_appointment(uuid, uuid, tstzrange, text, text) to authenticated, service_role;

create or replace function public.request_appointment(
  p_pet_id uuid,
  p_service_id uuid,
  p_proposed_window tstzrange,
  p_notes text,
  p_idempotency_key text
) returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.request_appointment(
    p_pet_id,
    p_service_id,
    p_proposed_window,
    p_notes,
    p_idempotency_key
  )
$$;

grant execute on function public.request_appointment(uuid, uuid, tstzrange, text, text)
  to authenticated;

insert into public.services (
  clinic_id,
  slug,
  category,
  name_i18n,
  description_i18n,
  duration_minutes,
  price_cents,
  currency,
  requires_pet_species,
  sort_order
)
select
  clinics.id,
  seed.slug,
  seed.category::public.service_category,
  seed.name_i18n::jsonb,
  seed.description_i18n::jsonb,
  seed.duration_minutes,
  seed.price_cents,
  'EUR',
  seed.requires_pet_species,
  seed.sort_order
from public.clinics
cross join (
  values
    (
      'annual-checkup',
      'checkup',
      '{"en":"Annual checkup","et":"Iga-aastane kontroll","ru":"Ежегодный осмотр"}',
      '{"en":"A general wellness visit covering weight, teeth, coat, behavior, and questions.","et":"Üldine tervisekontroll kaalu, hammaste, karva, käitumise ja küsimuste ülevaatuseks.","ru":"Общий профилактический визит: вес, зубы, шерсть, поведение и ваши вопросы."}',
      30,
      4500,
      array[]::text[],
      10
    ),
    (
      'vaccination',
      'vaccination',
      '{"en":"Vaccination visit","et":"Vaktsineerimise visiit","ru":"Вакцинация"}',
      '{"en":"Routine vaccination plus a quick wellness check.","et":"Tavapärane vaktsineerimine koos lühikese tervisekontrolliga.","ru":"Плановая вакцинация и короткий осмотр."}',
      20,
      3500,
      array[]::text[],
      20
    ),
    (
      'prescription-refill',
      'refill',
      '{"en":"Prescription refill","et":"Retsepti pikendamine","ru":"Продление рецепта"}',
      '{"en":"Renew an ongoing prescription. Subject to staff review.","et":"Püsiretsepti pikendamine. Kliinik vaatab päringu üle.","ru":"Продление текущего рецепта после проверки клиникой."}',
      10,
      null,
      array[]::text[],
      30
    ),
    (
      'wellness-consultation',
      'consultation',
      '{"en":"Wellness consultation","et":"Tervisenõustamine","ru":"Консультация по здоровью"}',
      '{"en":"Nutrition, behavior, or general health concerns.","et":"Toitumise, käitumise või üldise tervise küsimused.","ru":"Питание, поведение или общие вопросы здоровья."}',
      30,
      4000,
      array[]::text[],
      40
    ),
    (
      'dental-cleaning',
      'surgery',
      '{"en":"Dental cleaning","et":"Hammaste puhastus","ru":"Чистка зубов"}',
      '{"en":"Scale and polish under anesthesia. Includes pre-anesthetic check.","et":"Hambakivi eemaldus ja poleerimine anesteesias koos eelkontrolliga.","ru":"Снятие камня и полировка под анестезией, включая предварительный осмотр."}',
      60,
      18000,
      array['dog', 'cat']::text[],
      50
    ),
    (
      'grooming',
      'grooming',
      '{"en":"Grooming","et":"Hooldus","ru":"Груминг"}',
      '{"en":"Bath, trim, and nail clipping.","et":"Pesu, piiramine ja küünte lõikus.","ru":"Мытье, стрижка и подрезание когтей."}',
      60,
      5000,
      array['dog', 'cat']::text[],
      60
    )
) as seed(
  slug,
  category,
  name_i18n,
  description_i18n,
  duration_minutes,
  price_cents,
  requires_pet_species,
  sort_order
)
on conflict (clinic_id, slug) do nothing;
