# Appointments Contract

Owner-proposed clinic visits. Request-based in v1.5 (no live slot reservation).

## Goal

Let owners propose a time window for a clinic service. The clinic confirms via the existing inbox workflow.

## Owner

Codex (schema, RLS, RPC). Claude (UI).

## Schema

```sql
create type appointment_status as enum (
  'requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show'
);

create table appointments (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references clinics(id) on delete cascade,
  owner_id           uuid not null,
  pet_id             uuid not null,
  service_id         uuid,
  request_id         uuid,
  proposed_window    tstzrange not null,
  scheduled_at       timestamptz,
  duration_minutes   int,
  staff_id           uuid references clinic_staff(id),
  status             appointment_status not null default 'requested',
  notes              text,
  cancelled_reason   text,
  idempotency_key    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  foreign key (clinic_id, owner_id) references owners(clinic_id, id),
  foreign key (clinic_id, pet_id)   references pets(clinic_id, id),
  foreign key (clinic_id, service_id) references services(clinic_id, id),
  foreign key (clinic_id, request_id) references requests(clinic_id, id)
);

create unique index appointments_idem
  on appointments(clinic_id, owner_id, idempotency_key)
  where idempotency_key is not null;
```

## Creation RPC

Owners do not insert directly. They call:

```sql
public.request_appointment(
  p_pet_id uuid,
  p_service_id uuid,
  p_proposed_window tstzrange,
  p_notes text,
  p_idempotency_key text
) returns uuid
```

The RPC validates owner membership, service activity, species applicability, and the 5/day rate limit. In one transaction it creates:

- `requests(category='appointment', status='new', urgency='low', channel='web')`
- `appointments(status='requested')`
- first system `messages` summary ("Bruno – Annual checkup. Proposed: Tue 12 May, 14:00–16:00.")
- `request_events`
- `audit_logs`

## Status machine

| From → To | Trigger |
|---|---|
| `requested → confirmed` | Staff confirms with `scheduled_at` |
| `requested → rescheduled` | Staff proposes alternative |
| `rescheduled → confirmed` | Owner accepts |
| `* → cancelled` | Either side, before `scheduled_at` |
| `confirmed → completed` | Staff marks done |
| `confirmed → no_show` | Cron, 24h after `scheduled_at` |

`confirmed/completed/no_show` require non-null `scheduled_at`. Terminal statuses don't reopen in v1.

Every transition writes `request_events(event_type='appointment_status_changed')`. Cancellations within 2h of `scheduled_at` also write `late_cancel`.

## Reminders

On `confirmed`, schedule reminders with deterministic `source_key`:
- `T-24h`
- `T-2h`
- `T+1h` arrival check

`reminders.type='appointment'`, dedupe on `(clinic_id, type, source_key)`.

## UX acceptance

- Owner home/pet detail shows: `Pending review` / `Confirmed Tue 14:00` / `Rescheduled — please confirm`.
- Owner can cancel only when status ∈ {requested, confirmed, rescheduled}.
- Owner-side rescheduling NOT supported in v1.5.
- Copy localized EN/ET/RU.

## Test plan

- Status machine: valid transitions allowed, invalid blocked.
- Concurrent confirm: advisory lock; only one staff wins.
- Reminders fire via existing `/api/cron/reminders`.
- Isolation: owner A cannot read or cancel owner B's appointment.
- Idempotency: duplicate submissions with same key return existing id.

## Out of scope

- Live calendar / slot availability.
- Multi-pet appointments.
- Recurring appointments.
- Payment / deposit.

## Done when

- Owner can submit, view, cancel.
- Staff inbox surfaces appointment requests without inbox code changes.
- Reminders fire T-24h and T-2h.
- Isolation matrix green.
