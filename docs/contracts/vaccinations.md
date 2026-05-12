# Vaccinations Contract

Structured clinic-managed immunization records visible to owners.

## Goal

Replace unstructured `pets.medical_notes` for vaccinations with typed rows. Power the pet detail timeline and reminder dispatch.

## Owner

Codex (schema, RLS, ingestion). Claude (timeline UI).

## Schema

```sql
create table vaccinations (
  id                       uuid primary key default gen_random_uuid(),
  clinic_id                uuid not null references clinics(id) on delete cascade,
  pet_id                   uuid not null,
  vaccine_code             text not null,
  vaccine_name             text not null,
  administered_at          date not null,
  next_due_at              date,
  lot_number               text,
  manufacturer             text,
  administered_by_staff_id uuid references clinic_staff(id),
  notes                    text,
  source                   text not null default 'staff'
                            check (source in ('staff','pms_import','owner_attested')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  foreign key (clinic_id, pet_id) references pets(clinic_id, id)
);

create index vaccinations_pet on vaccinations(pet_id, administered_at desc);
create index vaccinations_clinic_due on vaccinations(clinic_id, next_due_at)
  where next_due_at is not null;
```

`(clinic_id, pet_id)` composite FK prevents cross-tenant records.

## Access

- Staff: full CRUD via `pets:manage`.
- Owner: `select` for their pets only. **Cannot** insert, update, delete, or self-attest.
- `source='owner_attested'` means clinic reviewed external proof and entered the record.

## Reminders

Cron extends existing `/api/cron/reminders`. For `next_due_at` ≤ 30 days, emits reminders with deterministic source keys:

- `T-30d`, `T-7d`, `T-1d` WhatsApp reminders.
- `reminders.type='vaccination'`, `(clinic_id, type, source_key)` dedupes.

Vaccination reminders respect `opted_out_at` on `owner_channel_identities`. They are operational care (not marketing), so allowed without explicit marketing consent.

## UX acceptance (owner pet detail → Vaccines tab)

- Timeline grouped by year, newest first.
- Row: vaccine name + date + "Next due: 14 Mar 2027" with color-coded urgency:
  - green: >90d or no due
  - amber: 30–90d
  - red: ≤30d or overdue
- Status banner top of tab:
  - green if no overdue, amber if any ≤30d, red if any overdue.
- Empty state: "Your clinic has not added vaccination records yet."

## Test plan

- Banner color reflects most-urgent row.
- Labels EN/ET/RU.
- Isolation: owner A cannot read owner B's pet vaccinations.
- Reminder dispatcher respects opt-out flag.

## Out of scope

- Lot recall lookups.
- Cross-clinic sync.
- Owner-uploaded certificates.
- EU pet passport export.

## Done when

- Vaccines tab renders timeline with correct urgency colors.
- Reminders fire on schedule.
- RLS isolation green.
