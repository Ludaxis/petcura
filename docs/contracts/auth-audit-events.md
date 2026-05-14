# `auth_events` Audit Table — Contract

> Owner: Codex. Claude consumes via a write helper called from server actions.
> Companion to merged plan §9.5.

## Problem

Today no audit trail exists for auth actions. We need a single append-only
table that records every magic-link request, OTP attempt, OAuth callback,
join-token attempt, and post-login redirect — with masked PII — so Codex can
investigate abuse and clinics can demonstrate compliance.

## Schema

```sql
create table auth_events (
  id           uuid primary key default gen_random_uuid(),
  actor_kind   text not null check (actor_kind in ('clinic_staff','owner','unknown')),
  actor_id     uuid,
  clinic_id    uuid,
  event_type   text not null,
  ip_inet      inet,
  user_agent   text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index auth_events_actor_idx     on auth_events (actor_kind, actor_id);
create index auth_events_clinic_idx    on auth_events (clinic_id);
create index auth_events_event_idx     on auth_events (event_type);
create index auth_events_created_idx   on auth_events (created_at desc);
```

## `event_type` catalog

| event_type                  | Fired by                                         | Required metadata                              |
|-----------------------------|--------------------------------------------------|------------------------------------------------|
| `magic_link_requested`      | `apps/web/app/login/actions.ts` `signInWithMagicLink` | `{ email_hash, result: 'sent'|'error', error_code? }` |
| `magic_link_consumed`       | `apps/web/app/auth/callback/route.ts`            | `{ next_path, post_login_reason }`             |
| `otp_requested`             | `apps/web/app/o/login/actions.ts` `requestOwnerOtp` | `{ phone_masked, channel, result, error_code? }` |
| `otp_verified`              | `apps/web/app/o/login/actions.ts` `verifyOwnerOtp` | `{ phone_masked, post_login_reason, destination }` |
| `otp_verify_failed`         | same                                             | `{ phone_masked, error_code }`                 |
| `oauth_started`             | `apps/web/app/o/login/actions.ts` `startOwnerOAuth` | `{ provider, next_path }`                      |
| `oauth_callback`            | `apps/web/app/o/auth/callback/route.ts`          | `{ provider, result, error_code?, post_login_reason }` |
| `join_token_attempted`      | `apps/web/app/o/join/route.ts`                   | `{ phone_masked, result, error_code? }`        |
| `join_token_consumed`       | same                                             | `{ phone_masked, clinic_id, pet_id?, post_login_reason }` |
| `signout`                   | both signout actions                             | `{ actor_kind }`                               |
| `routing_fallback`          | `/auth/callback/error`, `/o/auth/callback/error` | `{ reason }`                                    |

`post_login_reason` mirrors the router's `RouterOutput.reason` so each
redirect is auditable.

## PII handling

- `email_hash`: SHA-256 hex of normalized email — never the raw email.
- `phone_masked`: keep country code + last 2 digits (e.g. `+372…42`).
- `ip_inet`: stored as `inet`. Retention per existing policy (see
  `SECURITY.md`).
- Never store the raw OTP, the raw magic link token, or any session token.

## Write helper (Codex implements)

```ts
// apps/web/lib/auth/audit-events.ts
export async function writeAuthEvent(args: {
  eventType: string;
  actorKind: "clinic_staff" | "owner" | "unknown";
  actorId?: string | null;
  clinicId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void>;
```

Calls are fire-and-forget — logged on error, never rethrown into the auth
flow (auth must not fail because audit failed).

## RLS

- Clinic admins can `select` rows for their `clinic_id`.
- Owners cannot read auth_events at all.
- Service role writes only.

## Acceptance criteria

- Every auth action above produces a row. Negative tests confirm no auth
  action proceeds silently.
- Owner cannot read any row via Supabase client.
- p95 write < 20ms (fire-and-forget; never blocks the redirect).

## Files

- New: migration adding the table.
- New: `apps/web/lib/auth/audit-events.ts` write helper.
- Edit (by Codex, post-merge): all 6 auth-related server actions / route
  handlers to call `writeAuthEvent`.
