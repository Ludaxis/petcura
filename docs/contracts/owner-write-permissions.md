# Owner Write Permissions Contract

Default rule: owners cannot modify clinic-owned medical data. Every owner-writeable field is explicitly allowlisted and audited.

## Editable Fields

| Table | Field | Owner write |
|---|---|---|
| `owners` | `name` | Set only while empty |
| `owners` | `email` | Yes |
| `owners` | `preferred_language` | EN/ET/RU only |
| `owners` | `photo_url` | Yes |
| `owners` | `gdpr_consent_at` | Set only, never clear |
| `pets` | `photo_url` | Yes |
| `pets` | `owner_notes` | Yes |
| `pets` | `weight_kg` | No direct write; synchronized from `pet_weight_entries` |
| `pet_weight_entries` | new row | Owner insert only when `source='owner'` and `created_by=auth.uid()` |

Owners cannot edit pet name, species, breed, sex, birth date, allergies, medical notes, clinic notes, deleted flags, or tenant ownership columns.

## Weight Entries

```sql
create table pet_weight_entries (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references clinics(id) on delete cascade,
  pet_id       uuid not null,
  weight_kg    numeric(5,2) not null check (weight_kg > 0 and weight_kg < 200),
  measured_at  date not null,
  source       text not null check (source in ('owner','staff')),
  created_by   uuid,
  created_at   timestamptz not null default now(),
  foreign key (clinic_id, pet_id) references pets(clinic_id, id)
);

create index pet_weight_entries_pet on pet_weight_entries(pet_id, measured_at desc);
```

Trigger keeps `pets.weight_kg` synced to the most-recent entry by `(measured_at, created_at)`.

## Audit

Successful owner writes call `private.record_owner_profile_write(table_name, field, before, after)`.

- Open request exists → audit goes to `request_events(event_type='owner_profile_update')` with non-null `request_id`.
- No open request → audit goes to `audit_logs`.

Server actions must validate the same allowlist before issuing writes; database triggers are the final guardrail.

## Server Actions

- `updateOwnerProfile({ name?, email?, preferred_language?, photo_url? })`
- `updatePetPhoto(pet_id, file)`
- `addPetWeightEntry(pet_id, weight_kg, measured_at)`
- `setOwnerNotesOnPet(pet_id, owner_notes)`

All run with owner's Supabase session; RLS enforces row scope; server action additionally validates allowlist + writes audit in a single transaction.

## UX acceptance

- Editable fields show a small Edit affordance.
- Non-editable medical fields are read-only with no edit control (not even disabled).
- Photos route through existing `lib/profile-media.ts` for sizing + EXIF stripping.
- Success: localized toast with optimistic update.
- Failure: inline field-level error.

## Test plan

- Field allowlist enforcement (forbidden writes return 403).
- Concurrent updates: staff edit beats owner edit on conflicting fields.
- Every successful change writes an audit row.
- Isolation: owner A cannot write to owner B's rows.

## Out of scope

- Owner editing of `messages` (immutable).
- Owner deletion of pets (clinic-only).
- Owner self-merge of duplicates.

## Done when

- Allowlist enforced by both RLS and server actions.
- Every owner write produces an audit event.
- UI shows edit controls only for whitelisted fields.
