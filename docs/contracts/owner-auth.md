# Owner Auth Contract

Owner-side authentication for the PetCura Owner PWA at `https://my.petcura.app`. Pet parents identify with their **phone number** — the same phone already stored on `owners.phone` and indexed in `owner_channel_identities`.

## Goal

Let an owner verify ownership of a phone number known to a clinic, receive a Supabase session, and access only their own rows (owners, pets, requests, messages, reminders, attachments) through RLS.

## Owner

Codex (backend, Supabase Auth wiring, RLS, OTP delivery, isolation tests). Claude builds the UI.

## Flows

### A. Phone OTP (primary)

1. Owner enters phone in `/o/login`.
2. Server action `requestOwnerOtp(phone, clinic_slug?)` calls Twilio Verify (`channel=whatsapp` first, `channel=sms` on failure).
3. Twilio sends 6-digit code; no PetCura record is created until verification succeeds.
4. Owner enters code in `OtpForm`.
5. Server action `verifyOwnerOtp(phone, code)`:
   - Validates code with Twilio Verify.
   - Looks up `owners` rows by `phone` across **all clinics**.
   - 0 matches → "We could not find your number with any PetCura clinic. Please contact your clinic." (No account creation; staff must intake first.)
   - ≥1 match → create/update `auth.users` keyed by phone, link via `owner_users`, issue Supabase session.
6. Session cookie: `__Host-pc_owner_session` (httpOnly, secure, SameSite=Lax, path=/).
7. Owner JWT carries `app_metadata.petcura_actor = "owner"`. Staff RLS denies any session with that claim.

### B. Email magic link (fallback)

Standard Supabase magic link via `owner_user_identities(identity_type='email')`; restricted to `my.petcura.app` origin.

### C. WhatsApp deep-link onboarding

Clinic staff send an approved WhatsApp template with `https://my.petcura.app/o/join?token=<jwt>`.

- Token: HMAC-signed, `{ phone, clinic_id, exp }`, TTL 24h, single-use.
- Table: `owner_invites(id, clinic_id, phone, token_hash, expires_at, consumed_at, created_by_staff_id)`.
- `/o/join/[token]` verifies, marks consumed, issues session.

## Schema additions

```sql
create table owner_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table owner_user_identities (
  user_id        uuid not null references owner_users(user_id) on delete cascade,
  identity_type  text not null check (identity_type in ('phone','email')),
  identity_value text not null,
  primary key (identity_type, identity_value)
);

create table owner_user_memberships (
  user_id     uuid not null references owner_users(user_id) on delete cascade,
  clinic_id   uuid not null references clinics(id) on delete cascade,
  owner_id    uuid not null references owners(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (user_id, clinic_id),
  foreign key (clinic_id, owner_id) references owners(clinic_id, id)
);

create table owner_invites (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics(id) on delete cascade,
  phone               text not null,
  token_hash          text not null,
  expires_at          timestamptz not null,
  consumed_at         timestamptz,
  created_by_staff_id uuid references clinic_staff(id),
  created_at          timestamptz not null default now()
);
```

## RLS

Helper: `private.current_owner_id_for_clinic(clinic uuid) returns uuid` — returns the `owners.id` for the calling `auth.uid()` in that clinic via `owner_user_memberships`. Returns null if not an owner-context JWT.

Apply additive policies to pets, requests, messages, attachments, reminders. Existing staff policies unchanged.

Owners can never read: `ai_outputs`, `ai_memory_items`, `internal_notes`, `audit_logs`, `clinic_staff`, or anything outside their memberships.

## Rate limits

- 3 OTP requests per phone per hour.
- 5 verification attempts per OTP.
- 10 magic-link requests per email per day.
- 30 join-token attempts per IP per hour.

## Test plan

- Token signing/verification, rate limiters.
- Twilio Verify integration tests.
- Isolation: owner A cannot select owner B's pets, requests, messages, attachments, reminders.
- Replay: consumed `owner_invites` token cannot be reused.
- E2E: login → home → pet detail; signed-out → redirect to `/o/login`.

## Out of scope (v1.5)

- WebAuthn / passkeys.
- Social login.
- Owner self-registration without prior clinic intake.
- Staff impersonation of owner.

## Done when

- All four flows pass integration tests.
- RLS isolation matrix green.
- Staff RLS rejects owner-context JWTs.
