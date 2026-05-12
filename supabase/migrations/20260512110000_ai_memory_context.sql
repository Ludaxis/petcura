create table if not exists public.ai_memory_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  scope_type text not null check (scope_type in ('request', 'pet', 'owner')),
  scope_id uuid not null,
  memory_type text not null check (
    memory_type in (
      'request_context',
      'pet_context',
      'owner_preference',
      'communication_preference',
      'follow_up_context',
      'safety_context',
      'operational_note'
    )
  ),
  content_text text not null check (length(trim(content_text)) > 0),
  content_json jsonb not null default '{}'::jsonb,
  source_locale text,
  status text not null default 'candidate' check (
    status in ('candidate', 'accepted', 'rejected', 'expired')
  ),
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  source_ai_output_id uuid references public.ai_outputs(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_ai_memory_items_updated_at
before update on public.ai_memory_items
for each row
execute function public.set_updated_at();
create table if not exists public.ai_memory_sources (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  memory_item_id uuid not null references public.ai_memory_items(id) on delete cascade,
  source_type text not null check (
    source_type in ('request', 'message', 'internal_note', 'ai_output')
  ),
  source_id uuid not null,
  created_at timestamptz not null default now(),
  unique (memory_item_id, source_type, source_id)
);
create index if not exists ai_memory_items_scope_idx
  on public.ai_memory_items (clinic_id, scope_type, scope_id, status, updated_at desc)
  where deleted_at is null;
create index if not exists ai_memory_items_expiry_idx
  on public.ai_memory_items (clinic_id, expires_at)
  where deleted_at is null and expires_at is not null;
create index if not exists ai_memory_sources_memory_idx
  on public.ai_memory_sources (clinic_id, memory_item_id);
alter table public.ai_memory_items enable row level security;
alter table public.ai_memory_sources enable row level security;
create policy ai_memory_items_select_isolation on public.ai_memory_items
  for select using (public.is_active_clinic_member(clinic_id));
create policy ai_memory_items_insert_write on public.ai_memory_items
  for insert with check (private.can_write_clinic_data(clinic_id));
create policy ai_memory_items_update_write on public.ai_memory_items
  for update using (private.can_write_clinic_data(clinic_id))
  with check (private.can_write_clinic_data(clinic_id));
create policy ai_memory_items_delete_write on public.ai_memory_items
  for delete using (private.can_write_clinic_data(clinic_id));
create policy ai_memory_sources_select_isolation on public.ai_memory_sources
  for select using (public.is_active_clinic_member(clinic_id));
create policy ai_memory_sources_insert_write on public.ai_memory_sources
  for insert with check (
    private.can_write_clinic_data(clinic_id)
    and exists (
      select 1
      from public.ai_memory_items
      where ai_memory_items.id = memory_item_id
        and ai_memory_items.clinic_id = ai_memory_sources.clinic_id
    )
  );
create policy ai_memory_sources_update_write on public.ai_memory_sources
  for update using (private.can_write_clinic_data(clinic_id))
  with check (
    private.can_write_clinic_data(clinic_id)
    and exists (
      select 1
      from public.ai_memory_items
      where ai_memory_items.id = memory_item_id
        and ai_memory_items.clinic_id = ai_memory_sources.clinic_id
    )
  );
create policy ai_memory_sources_delete_write on public.ai_memory_sources
  for delete using (private.can_write_clinic_data(clinic_id));
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ai_memory_items'
  ) then
    alter publication supabase_realtime add table public.ai_memory_items;
  end if;
end $$;
alter table public.ai_memory_items replica identity full;
