# Services Catalog Contract

Per-clinic catalog of bookable services. Read-only from the owner side.

## Goal

Each clinic publishes a small list of services (checkup, vaccination, refill, grooming, consultation, surgery, other) with localized name + description, duration, price, species applicability.

## Owner

Codex (schema, RLS, admin UI). Claude (owner-side catalog UI).

## Schema

```sql
create type service_category as enum (
  'checkup', 'vaccination', 'refill', 'grooming',
  'consultation', 'surgery', 'other'
);

create table services (
  id                     uuid primary key default gen_random_uuid(),
  clinic_id              uuid not null references clinics(id) on delete cascade,
  slug                   text not null,
  category               service_category not null,
  name_i18n              jsonb not null,
  description_i18n       jsonb not null default '{}'::jsonb,
  duration_minutes       int not null check (duration_minutes > 0),
  price_cents            int,
  currency               char(3) not null default 'EUR' check (currency = upper(currency)),
  requires_pet_species   text[] not null default '{}',
  is_active              bool not null default true,
  sort_order             int not null default 100,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index services_clinic_slug on services(clinic_id, slug);
create index services_clinic_active on services(clinic_id, is_active, sort_order);
```

## Permissions

- `services:view` — staff with clinic membership.
- `services:manage` — owner/admin staff only, enforced in app permissions AND RLS.

## RLS

- Owner: `select` on `is_active = true` services whose clinic is in `owner_user_memberships`.
- Staff: `select` for clinics they belong to; `insert/update/delete` only with `services:manage`.
- Anonymous: no access.

Owner selection is filtered by pet species when `requires_pet_species` is non-empty.

## Seed (per clinic on creation)

| slug | category | en name | duration |
|---|---|---|---|
| `annual-checkup` | checkup | Annual checkup | 30 |
| `vaccination` | vaccination | Vaccination visit | 20 |
| `prescription-refill` | refill | Prescription refill | 10 |
| `wellness-consultation` | consultation | Wellness consultation | 30 |
| `dental-cleaning` | surgery | Dental cleaning | 60 |
| `grooming` | grooming | Grooming | 60 |

## UX acceptance (owner side)

- Services grouped by category.
- Card shows localized name, duration, price (or "Price on request"), species filter applied.
- Tap → `/o/services/[slug]/request`.
- Empty state: "Your clinic hasn't published services yet. You can still ask any question in chat."

## Test plan

- i18n fallback (missing `ru` → `en`).
- Owner cannot read services of a clinic they don't belong to.
- E2E: catalog renders + filters by species + opens booking flow.

## Out of scope

- Pricing tiers / discounts / promo codes.
- Service bundles.
- Resource constraints.
- Inventory tracking.

## Done when

- Each new clinic gets default seed.
- Catalog renders in EN/ET/RU with text-expansion compliance.
- Owners only see services applicable to their pets' species.
