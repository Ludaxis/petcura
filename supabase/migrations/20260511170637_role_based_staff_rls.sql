create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.active_staff_role(target_clinic_id uuid)
returns public.staff_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select clinic_staff.role
  from public.clinic_staff
  where clinic_staff.clinic_id = target_clinic_id
    and clinic_staff.user_id = auth.uid()
    and clinic_staff.is_active = true
  order by clinic_staff.created_at asc
  limit 1
$$;

create or replace function private.can_write_clinic_data(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    private.active_staff_role(target_clinic_id) in (
      'owner',
      'admin',
      'vet',
      'tech',
      'reception'
    ),
    false
  )
$$;

revoke all on function private.active_staff_role(uuid) from public;
revoke all on function private.can_write_clinic_data(uuid) from public;
grant execute on function private.active_staff_role(uuid) to authenticated, service_role;
grant execute on function private.can_write_clinic_data(uuid) to authenticated, service_role;

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

drop policy if exists owners_select_isolation on public.owners;
drop policy if exists owner_channel_identities_select_isolation on public.owner_channel_identities;
drop policy if exists pets_select_isolation on public.pets;
drop policy if exists requests_select_isolation on public.requests;
drop policy if exists messages_select_isolation on public.messages;
drop policy if exists attachments_select_isolation on public.attachments;
drop policy if exists message_delivery_events_select_isolation on public.message_delivery_events;
drop policy if exists internal_notes_select_isolation on public.internal_notes;
drop policy if exists request_events_select_isolation on public.request_events;
drop policy if exists ai_outputs_select_isolation on public.ai_outputs;
drop policy if exists reminders_select_isolation on public.reminders;
drop policy if exists clinic_channels_select_isolation on public.clinic_channels;
drop policy if exists audit_logs_select_isolation on public.audit_logs;

drop policy if exists owners_insert_write on public.owners;
drop policy if exists owner_channel_identities_insert_write on public.owner_channel_identities;
drop policy if exists pets_insert_write on public.pets;
drop policy if exists requests_insert_write on public.requests;
drop policy if exists messages_insert_write on public.messages;
drop policy if exists attachments_insert_write on public.attachments;
drop policy if exists message_delivery_events_insert_write on public.message_delivery_events;
drop policy if exists internal_notes_insert_write on public.internal_notes;
drop policy if exists request_events_insert_write on public.request_events;
drop policy if exists ai_outputs_insert_write on public.ai_outputs;
drop policy if exists reminders_insert_write on public.reminders;
drop policy if exists clinic_channels_insert_write on public.clinic_channels;
drop policy if exists audit_logs_insert_write on public.audit_logs;

drop policy if exists owners_update_write on public.owners;
drop policy if exists owner_channel_identities_update_write on public.owner_channel_identities;
drop policy if exists pets_update_write on public.pets;
drop policy if exists requests_update_write on public.requests;
drop policy if exists messages_update_write on public.messages;
drop policy if exists attachments_update_write on public.attachments;
drop policy if exists message_delivery_events_update_write on public.message_delivery_events;
drop policy if exists internal_notes_update_write on public.internal_notes;
drop policy if exists request_events_update_write on public.request_events;
drop policy if exists ai_outputs_update_write on public.ai_outputs;
drop policy if exists reminders_update_write on public.reminders;
drop policy if exists clinic_channels_update_write on public.clinic_channels;
drop policy if exists audit_logs_update_write on public.audit_logs;

drop policy if exists owners_delete_write on public.owners;
drop policy if exists owner_channel_identities_delete_write on public.owner_channel_identities;
drop policy if exists pets_delete_write on public.pets;
drop policy if exists requests_delete_write on public.requests;
drop policy if exists messages_delete_write on public.messages;
drop policy if exists attachments_delete_write on public.attachments;
drop policy if exists message_delivery_events_delete_write on public.message_delivery_events;
drop policy if exists internal_notes_delete_write on public.internal_notes;
drop policy if exists request_events_delete_write on public.request_events;
drop policy if exists ai_outputs_delete_write on public.ai_outputs;
drop policy if exists reminders_delete_write on public.reminders;
drop policy if exists clinic_channels_delete_write on public.clinic_channels;
drop policy if exists audit_logs_delete_write on public.audit_logs;

create policy owners_select_isolation on public.owners
  for select using (public.is_active_clinic_member(clinic_id));
create policy owner_channel_identities_select_isolation on public.owner_channel_identities
  for select using (public.is_active_clinic_member(clinic_id));
create policy pets_select_isolation on public.pets
  for select using (public.is_active_clinic_member(clinic_id));
create policy requests_select_isolation on public.requests
  for select using (public.is_active_clinic_member(clinic_id));
create policy messages_select_isolation on public.messages
  for select using (public.is_active_clinic_member(clinic_id));
create policy attachments_select_isolation on public.attachments
  for select using (public.is_active_clinic_member(clinic_id));
create policy message_delivery_events_select_isolation on public.message_delivery_events
  for select using (public.is_active_clinic_member(clinic_id));
create policy internal_notes_select_isolation on public.internal_notes
  for select using (public.is_active_clinic_member(clinic_id));
create policy request_events_select_isolation on public.request_events
  for select using (public.is_active_clinic_member(clinic_id));
create policy ai_outputs_select_isolation on public.ai_outputs
  for select using (public.is_active_clinic_member(clinic_id));
create policy reminders_select_isolation on public.reminders
  for select using (public.is_active_clinic_member(clinic_id));
create policy clinic_channels_select_isolation on public.clinic_channels
  for select using (public.is_active_clinic_member(clinic_id));
create policy audit_logs_select_isolation on public.audit_logs
  for select using (public.is_active_clinic_member(clinic_id));

create policy owners_insert_write on public.owners
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy owner_channel_identities_insert_write on public.owner_channel_identities
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy pets_insert_write on public.pets
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy requests_insert_write on public.requests
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy messages_insert_write on public.messages
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy attachments_insert_write on public.attachments
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy message_delivery_events_insert_write on public.message_delivery_events
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy internal_notes_insert_write on public.internal_notes
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy request_events_insert_write on public.request_events
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy ai_outputs_insert_write on public.ai_outputs
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy reminders_insert_write on public.reminders
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy clinic_channels_insert_write on public.clinic_channels
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy audit_logs_insert_write on public.audit_logs
  for insert with check (private.can_write_clinic_data(clinic_id));

create policy owners_update_write on public.owners
  for update using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));
create policy owner_channel_identities_update_write on public.owner_channel_identities
  for update using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));
create policy pets_update_write on public.pets
  for update using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));
create policy requests_update_write on public.requests
  for update using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));
create policy ai_outputs_update_write on public.ai_outputs
  for update using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));
create policy reminders_update_write on public.reminders
  for update using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));
create policy clinic_channels_update_write on public.clinic_channels
  for update using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));
