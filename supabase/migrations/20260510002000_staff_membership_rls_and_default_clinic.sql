-- Staff membership is the v1 RLS primitive.
-- The custom active_clinic_id JWT claim remains supported, but the app no
-- longer depends on configuring that hook before staff can read their clinic.

create or replace function public.is_active_clinic_member(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.clinic_staff
    where clinic_staff.clinic_id = target_clinic_id
      and clinic_staff.user_id = auth.uid()
      and clinic_staff.is_active = true
  )
$$;

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
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
$$;

revoke all on function public.is_active_clinic_member(uuid) from public;
revoke all on function public.current_clinic_id() from public;
grant execute on function public.is_active_clinic_member(uuid) to anon, authenticated, service_role;
grant execute on function public.current_clinic_id() to anon, authenticated, service_role;

insert into public.clinics (id, name, slug, country, timezone, locale)
values (
  '00000000-0000-4000-8000-000000000001',
  'Alex Veterinary Clinic',
  'alex-vet-demo',
  'EE',
  'Europe/Tallinn',
  'en'
)
on conflict (slug) do update
set
  name = excluded.name,
  country = excluded.country,
  timezone = excluded.timezone,
  locale = excluded.locale;

drop policy if exists clinics_isolation on public.clinics;
drop policy if exists clinic_staff_isolation on public.clinic_staff;
drop policy if exists owners_isolation on public.owners;
drop policy if exists owner_channel_identities_isolation on public.owner_channel_identities;
drop policy if exists pets_isolation on public.pets;
drop policy if exists requests_isolation on public.requests;
drop policy if exists messages_isolation on public.messages;
drop policy if exists attachments_isolation on public.attachments;
drop policy if exists message_delivery_events_isolation on public.message_delivery_events;
drop policy if exists internal_notes_isolation on public.internal_notes;
drop policy if exists request_events_isolation on public.request_events;
drop policy if exists ai_outputs_isolation on public.ai_outputs;
drop policy if exists reminders_isolation on public.reminders;
drop policy if exists clinic_channels_isolation on public.clinic_channels;
drop policy if exists audit_logs_isolation on public.audit_logs;

create policy clinics_isolation on public.clinics
  for select
  using (public.is_active_clinic_member(id));

create policy clinic_staff_select_isolation on public.clinic_staff
  for select
  using (public.is_active_clinic_member(clinic_id));

create policy owners_isolation on public.owners
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy owner_channel_identities_isolation on public.owner_channel_identities
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy pets_isolation on public.pets
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy requests_isolation on public.requests
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy messages_isolation on public.messages
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy attachments_isolation on public.attachments
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy message_delivery_events_isolation on public.message_delivery_events
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy internal_notes_isolation on public.internal_notes
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy request_events_isolation on public.request_events
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy ai_outputs_isolation on public.ai_outputs
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy reminders_isolation on public.reminders
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy clinic_channels_isolation on public.clinic_channels
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));

create policy audit_logs_isolation on public.audit_logs
  using (public.is_active_clinic_member(clinic_id))
  with check (public.is_active_clinic_member(clinic_id));
