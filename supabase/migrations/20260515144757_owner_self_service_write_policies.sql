-- Owner self-service write guardrails.
-- Rollback: drop the owner update policies/triggers below and restore
-- public.sync_pet_latest_weight from 20260513101740 if direct owner RLS writes
-- are reverted.

create or replace function private.enforce_owner_self_service_writes()
returns trigger
language plpgsql
as $$
declare
  weight_sync_allowed boolean;
begin
  if not private.is_owner_actor() then
    return new;
  end if;

  if tg_table_name = 'owners' then
    if new.id is distinct from old.id
      or new.clinic_id is distinct from old.clinic_id
      or new.phone is distinct from old.phone
      or new.notes is distinct from old.notes
      or new.gdpr_consent_at is distinct from old.gdpr_consent_at
      or new.created_at is distinct from old.created_at
      or new.deleted_at is distinct from old.deleted_at
    then
      raise exception 'owner_forbidden_field_update'
        using errcode = 'P0001';
    end if;

    if new.preferred_language not in ('en', 'et', 'ru') then
      raise exception 'owner_invalid_preferred_language'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  if tg_table_name = 'pets' then
    weight_sync_allowed =
      coalesce(current_setting('petcura.allow_weight_sync', true), '') = 'true';

    if new.id is distinct from old.id
      or new.clinic_id is distinct from old.clinic_id
      or new.owner_id is distinct from old.owner_id
      or new.name is distinct from old.name
      or new.species is distinct from old.species
      or new.breed is distinct from old.breed
      or new.sex is distinct from old.sex
      or new.birth_date is distinct from old.birth_date
      or new.allergies is distinct from old.allergies
      or new.medical_notes is distinct from old.medical_notes
      or new.created_at is distinct from old.created_at
      or new.deleted_at is distinct from old.deleted_at
      or (
        new.weight_kg is distinct from old.weight_kg
        and not weight_sync_allowed
      )
    then
      raise exception 'owner_forbidden_field_update'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists owners_owner_self_service_guard
  on public.owners;
create trigger owners_owner_self_service_guard
before update on public.owners
for each row
execute function private.enforce_owner_self_service_writes();

drop trigger if exists pets_owner_self_service_guard
  on public.pets;
create trigger pets_owner_self_service_guard
before update on public.pets
for each row
execute function private.enforce_owner_self_service_writes();

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

  perform set_config('petcura.allow_weight_sync', 'true', true);

  update public.pets
  set weight_kg = latest_weight
  where clinic_id = target_clinic_id
    and id = target_pet_id;

  perform set_config('petcura.allow_weight_sync', '', true);

  return coalesce(new, old);
end;
$$;

drop policy if exists owners_owner_update_self on public.owners;
create policy owners_owner_update_self on public.owners
  for update to authenticated
  using (
    private.is_owner_actor()
    and id = private.current_owner_id_for_clinic(clinic_id)
    and deleted_at is null
  )
  with check (
    private.is_owner_actor()
    and id = private.current_owner_id_for_clinic(clinic_id)
    and deleted_at is null
  );

drop policy if exists pets_owner_update_self on public.pets;
create policy pets_owner_update_self on public.pets
  for update to authenticated
  using (
    private.is_owner_actor()
    and deleted_at is null
    and owner_id = private.current_owner_id_for_clinic(clinic_id)
  )
  with check (
    private.is_owner_actor()
    and deleted_at is null
    and owner_id = private.current_owner_id_for_clinic(clinic_id)
  );

grant update on public.owners to authenticated;
grant update on public.pets to authenticated;
