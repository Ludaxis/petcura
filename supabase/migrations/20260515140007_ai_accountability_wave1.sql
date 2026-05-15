-- Wave 1 AI accountability.
-- Rollback note: drop public.ai_output_sources, then drop the added
-- ai_outputs columns/indexes/constraints if this release is reverted.

alter table public.ai_outputs
  add column if not exists status text not null default 'success',
  add column if not exists provider text,
  add column if not exists prompt_key text,
  add column if not exists prompt_hash text,
  add column if not exists failure_reason text,
  add column if not exists blocked_reason text,
  add column if not exists raw_output_text text,
  add column if not exists review_status text not null default 'pending',
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text,
  add column if not exists provenance_json jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_outputs_status_check'
      and conrelid = 'public.ai_outputs'::regclass
  ) then
    alter table public.ai_outputs
      add constraint ai_outputs_status_check
      check (
        status in (
          'success',
          'fallback',
          'schema_failure',
          'provider_error',
          'blocked'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_outputs_review_status_check'
      and conrelid = 'public.ai_outputs'::regclass
  ) then
    alter table public.ai_outputs
      add constraint ai_outputs_review_status_check
      check (
        review_status in (
          'pending',
          'accepted',
          'accepted_with_edits',
          'edited',
          'rejected',
          'not_reviewable'
        )
      );
  end if;
end $$;

update public.ai_outputs
set review_status = case
    when accepted is true and edited_output_json is not null then 'accepted_with_edits'
    when accepted is true then 'accepted'
    when accepted is false then 'rejected'
    else review_status
  end,
  reviewed_at = case
    when reviewed_by is not null and reviewed_at is null then created_at
    else reviewed_at
  end
where accepted is not null
  or reviewed_by is not null;

create index if not exists ai_outputs_accountability_idx
  on public.ai_outputs (clinic_id, request_id, kind, status, created_at desc);

create index if not exists ai_outputs_prompt_hash_idx
  on public.ai_outputs (prompt_hash)
  where prompt_hash is not null;

create index if not exists ai_outputs_review_status_idx
  on public.ai_outputs (clinic_id, review_status, created_at desc);

create table if not exists public.ai_output_sources (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  ai_output_id uuid not null references public.ai_outputs(id) on delete cascade,
  source_type text not null check (
    source_type in (
      'request',
      'message',
      'internal_note',
      'ai_output',
      'ai_memory_item',
      'owner',
      'pet',
      'web_intake_session'
    )
  ),
  source_id uuid not null,
  source_label text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (ai_output_id, source_type, source_id)
);

create index if not exists ai_output_sources_output_idx
  on public.ai_output_sources (clinic_id, ai_output_id);

create index if not exists ai_output_sources_lookup_idx
  on public.ai_output_sources (clinic_id, source_type, source_id);

alter table public.ai_output_sources enable row level security;

drop policy if exists ai_output_sources_select_isolation
  on public.ai_output_sources;
drop policy if exists ai_output_sources_insert_write
  on public.ai_output_sources;
drop policy if exists ai_output_sources_update_write
  on public.ai_output_sources;
drop policy if exists ai_output_sources_delete_write
  on public.ai_output_sources;

create policy ai_output_sources_select_isolation on public.ai_output_sources
  for select using (public.is_active_clinic_member(clinic_id));

create policy ai_output_sources_insert_write on public.ai_output_sources
  for insert with check (
    private.can_write_clinic_data(clinic_id)
    and exists (
      select 1
      from public.ai_outputs
      where ai_outputs.id = ai_output_sources.ai_output_id
        and ai_outputs.clinic_id = ai_output_sources.clinic_id
    )
  );

create policy ai_output_sources_update_write on public.ai_output_sources
  for update using (private.can_write_clinic_data(clinic_id))
  with check (
    private.can_write_clinic_data(clinic_id)
    and exists (
      select 1
      from public.ai_outputs
      where ai_outputs.id = ai_output_sources.ai_output_id
        and ai_outputs.clinic_id = ai_output_sources.clinic_id
    )
  );

create policy ai_output_sources_delete_write on public.ai_output_sources
  for delete using (private.can_write_clinic_data(clinic_id));

revoke all on public.ai_outputs from anon;
grant select, insert, update, delete on public.ai_outputs to authenticated;
grant all on public.ai_outputs to service_role;

revoke all on public.ai_output_sources from anon;
grant select, insert, update, delete on public.ai_output_sources to authenticated;
grant all on public.ai_output_sources to service_role;
