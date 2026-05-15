-- Public marketing demo leads.
-- Insert-only anonymous surface for clinic buyers; no owner intake, medical
-- record, or tenant-owned data belongs here.

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'demo_page'
    check (
      source in (
        'hero',
        'owner_path',
        'pricing',
        'final_cta',
        'mobile_bar',
        'demo_page',
        'sandbox',
        'trust',
        'footer'
      )
    ),
  locale text not null default 'en'
    check (locale in ('en', 'et', 'ru')),
  clinic_name text not null
    check (char_length(btrim(clinic_name)) between 2 and 160),
  contact_name text not null
    check (char_length(btrim(contact_name)) between 2 and 140),
  work_email text not null
    check (
      char_length(work_email) <= 254
      and work_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    ),
  country text not null
    check (char_length(btrim(country)) between 2 and 80),
  pms_system text
    check (pms_system is null or char_length(btrim(pms_system)) <= 100),
  monthly_request_volume text
    check (
      monthly_request_volume is null
      or monthly_request_volume in (
        'under_100',
        '100_300',
        '300_800',
        '800_plus',
        'unknown'
      )
    ),
  message text
    check (message is null or char_length(message) <= 1000),
  consent_given boolean not null default false
    check (consent_given is true),
  user_agent_hash text
    check (user_agent_hash is null or char_length(user_agent_hash) <= 96)
);

create index if not exists marketing_leads_created_at_idx
  on public.marketing_leads (created_at desc);
create index if not exists marketing_leads_source_created_at_idx
  on public.marketing_leads (source, created_at desc);

alter table public.marketing_leads enable row level security;

drop policy if exists marketing_leads_public_insert
  on public.marketing_leads;
create policy marketing_leads_public_insert
  on public.marketing_leads
  for insert to anon, authenticated
  with check (consent_given is true);

revoke all on public.marketing_leads from anon;
revoke all on public.marketing_leads from authenticated;

grant insert on public.marketing_leads to anon;
grant insert on public.marketing_leads to authenticated;
grant all on public.marketing_leads to service_role;
