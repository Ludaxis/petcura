-- Super-admin workflow fields for public demo/pilot leads.
-- Public insert semantics stay unchanged: clinic buyers can only insert
-- consented rows; workflow management remains service-role/server-only.

alter table public.marketing_leads
  add column if not exists status text not null default 'new',
  add column if not exists admin_note text,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists last_contacted_by uuid,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid,
  add column if not exists updated_at timestamptz;

update public.marketing_leads
set updated_at = created_at
where updated_at is null;

alter table public.marketing_leads
  alter column updated_at set default now(),
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketing_leads_status_check'
      and conrelid = 'public.marketing_leads'::regclass
  ) then
    alter table public.marketing_leads
      add constraint marketing_leads_status_check
      check (status in ('new', 'contacted', 'qualified', 'converted', 'archived'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketing_leads_admin_note_length_check'
      and conrelid = 'public.marketing_leads'::regclass
  ) then
    alter table public.marketing_leads
      add constraint marketing_leads_admin_note_length_check
      check (admin_note is null or char_length(admin_note) <= 1200);
  end if;
end $$;

create index if not exists marketing_leads_status_updated_at_idx
  on public.marketing_leads (status, updated_at desc);
create index if not exists marketing_leads_archived_at_idx
  on public.marketing_leads (archived_at desc)
  where archived_at is not null;

drop trigger if exists set_marketing_leads_updated_at
  on public.marketing_leads;
create trigger set_marketing_leads_updated_at
before update on public.marketing_leads
for each row
execute function public.set_updated_at();

create table if not exists public.marketing_lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.marketing_leads(id) on delete cascade,
  actor_id uuid,
  actor_email text
    check (
      actor_email is null
      or (
        char_length(actor_email) <= 254
        and actor_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
      )
    ),
  action text not null
    check (char_length(btrim(action)) between 2 and 80),
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists marketing_lead_events_lead_created_at_idx
  on public.marketing_lead_events (lead_id, created_at desc);
create index if not exists marketing_lead_events_created_at_idx
  on public.marketing_lead_events (created_at desc);

alter table public.marketing_lead_events enable row level security;

revoke all on public.marketing_lead_events from anon;
revoke all on public.marketing_lead_events from authenticated;
grant all on public.marketing_lead_events to service_role;
