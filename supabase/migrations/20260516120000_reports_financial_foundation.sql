-- Reports financial foundation.
-- Rollback note: drop public.pms_invoice_summaries, the helper function, and
-- the additive report indexes if this release is reverted.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.can_read_financial_reports(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    private.active_staff_role(target_clinic_id) in ('owner', 'admin'),
    false
  )
$$;

revoke all on function private.can_read_financial_reports(uuid) from public;
grant execute on function private.can_read_financial_reports(uuid)
  to authenticated, service_role;

create table if not exists public.pms_invoice_summaries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  owner_id uuid not null,
  pet_id uuid,
  source_system text not null,
  external_invoice_id_hash text not null,
  issued_at timestamptz not null,
  currency char(3) not null default 'EUR'
    check (currency = upper(currency)),
  gross_amount_cents integer not null check (gross_amount_cents >= 0),
  service_category text,
  metadata_json jsonb not null default '{}'::jsonb,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_id, owner_id) references public.owners(clinic_id, id)
    on delete cascade,
  foreign key (clinic_id, pet_id) references public.pets(clinic_id, id)
    on delete set null,
  unique (clinic_id, source_system, external_invoice_id_hash)
);

drop trigger if exists set_pms_invoice_summaries_updated_at
  on public.pms_invoice_summaries;
create trigger set_pms_invoice_summaries_updated_at
before update on public.pms_invoice_summaries
for each row
execute function public.set_updated_at();

create index if not exists pms_invoice_summaries_clinic_issued_idx
  on public.pms_invoice_summaries (clinic_id, issued_at desc)
  where voided_at is null;

create index if not exists pms_invoice_summaries_owner_issued_idx
  on public.pms_invoice_summaries (clinic_id, owner_id, issued_at desc)
  where voided_at is null;

create index if not exists pms_invoice_summaries_pet_issued_idx
  on public.pms_invoice_summaries (clinic_id, pet_id, issued_at desc)
  where pet_id is not null and voided_at is null;

create index if not exists reports_requests_created_idx
  on public.requests (clinic_id, created_at desc);

create index if not exists reports_requests_resolved_idx
  on public.requests (clinic_id, resolved_at desc)
  where resolved_at is not null;

create index if not exists reports_messages_request_sender_created_idx
  on public.messages (clinic_id, request_id, sender_type, created_at);

create index if not exists reports_reminders_due_idx
  on public.reminders (clinic_id, due_at desc);

create index if not exists reports_ai_outputs_created_idx
  on public.ai_outputs (clinic_id, created_at desc);

create index if not exists reports_vaccinations_due_idx
  on public.vaccinations (clinic_id, next_due_at)
  where next_due_at is not null;

create index if not exists reports_pet_weight_entries_measured_idx
  on public.pet_weight_entries (clinic_id, pet_id, measured_at desc);

create index if not exists reports_outbound_messages_created_idx
  on public.outbound_messages (clinic_id, created_at desc);

alter table public.pms_invoice_summaries enable row level security;

drop policy if exists pms_invoice_summaries_select_financial
  on public.pms_invoice_summaries;
drop policy if exists pms_invoice_summaries_insert_financial
  on public.pms_invoice_summaries;
drop policy if exists pms_invoice_summaries_update_financial
  on public.pms_invoice_summaries;
drop policy if exists pms_invoice_summaries_delete_financial
  on public.pms_invoice_summaries;

create policy pms_invoice_summaries_select_financial
  on public.pms_invoice_summaries
  for select to authenticated
  using (private.can_read_financial_reports(clinic_id));

create policy pms_invoice_summaries_insert_financial
  on public.pms_invoice_summaries
  for insert to authenticated
  with check (private.can_read_financial_reports(clinic_id));

create policy pms_invoice_summaries_update_financial
  on public.pms_invoice_summaries
  for update to authenticated
  using (private.can_read_financial_reports(clinic_id))
  with check (private.can_read_financial_reports(clinic_id));

create policy pms_invoice_summaries_delete_financial
  on public.pms_invoice_summaries
  for delete to authenticated
  using (private.can_read_financial_reports(clinic_id));

revoke all on public.pms_invoice_summaries from public, anon, authenticated;
grant select, insert, update, delete on public.pms_invoice_summaries
  to authenticated;
grant all on public.pms_invoice_summaries to service_role;
