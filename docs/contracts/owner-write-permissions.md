# Owner Write Permissions Contract

Default rule: owners cannot modify clinic-owned medical data. Every owner-writeable field is explicitly allowlisted and audited.

## Editable Fields

| Table | Field | Owner write |
|---|---|---|
| `owners` | `name` | Yes |
| `owners` | `email` | Yes |
| `owners` | `preferred_language` | EN/ET/RU only |
| `owners` | `photo_url` | Yes |
| `owners` | `gdpr_consent_at` | No self-service write in this slice |
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

Successful owner writes must write `audit_logs` with the owner auth user as
`actor_id` and the edited record as `entity_id`.

Implemented v1 audit actions:

- `owner_profile_self_updated` for `/o/me`
- `owner_pet_self_updated` for `/o/pets/[petId]`
- `owner_web_request_created` for `/o/chat/new`

Server actions validate the same allowlist before issuing writes. In the
current pilot implementation, owner profile/pet updates use an admin server
client after `requireOwnerContext()` verifies ownership and clinic scope. The
database also enforces the owner-session boundary with RLS update policies and
write-guard triggers from
`supabase/migrations/20260515144757_owner_self_service_write_policies.sql`.
`pet_weight_entries` has owner insert RLS and remains the durable weight
provenance table.

## Server Actions

- `updateOwnerSelfProfile(formData)` updates owner name, email, preferred language, and photo.
- `updateOwnerPetSelfService(formData)` updates pet photo, owner notes, and optional weight entry.
- `startOwnerRequest(formData)` creates a new owner request + first message from `/o/chat/new`.

All actions resolve the owner by session, reject cross-owner pet/request ids,
validate whitelisted fields, and write audit.

## UX acceptance

- Editable fields show a clear profile editor affordance.
- Non-editable medical fields are read-only with no edit control (not even disabled).
- Photos route through existing `lib/profile-media.ts` for sizing + EXIF stripping.
- Success: server redirect back to the edited surface with localized page state.
- Failure: server redirect or thrown route error depending on severity; field-level errors remain a follow-up polish item.

## Test plan

- Field allowlist enforcement at server action and RLS/trigger layers
  (`owner_forbidden_field_update` / `pet_forbidden_field_update` for forbidden
  direct SQL writes).
- Concurrent updates: staff edit beats owner edit on conflicting fields.
- Every successful change writes an audit row.
- Isolation: owner A cannot write to owner B's rows.

## Out of scope

- Owner editing of `messages` (immutable).
- Owner deletion of pets (clinic-only).
- Owner self-merge of duplicates.

## Done when

- Allowlist enforced by server actions plus owner-specific RLS update policies
  and triggers for `owners` and `pets`.
- Every owner write produces an audit event.
- UI shows edit controls only for whitelisted fields.
