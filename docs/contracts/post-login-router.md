# Post-Login Router — Contract

> Owner: Codex (server queries + auth context wiring). Claude owns the pure
> router function and the call-sites in the two callback routes + `verifyOwnerOtp`.
> Companion to merged plan §3 and §9 in
> `docs/design/auth-onboarding-merged-plan-2026-05.md`.

## Problem

`/auth/callback`, `/o/auth/callback`, and `verifyOwnerOtp` currently hardcode
post-auth redirects (`/inbox`, `/o`). New owners, invited staff, returning
staff, and returning owners need different destinations. The pure routing
function lives in `apps/web/lib/auth/post-login-router.ts` (Claude); the data
inputs come from server-side queries that respect RLS (Codex).

## Inputs Claude's frontend code already calls

`apps/web/lib/auth/post-login-router.ts` exports:

```ts
export type ClinicStaffRole = "reception" | "vet" | "admin";

export type RouterActor =
  | {
      kind: "clinic_staff";
      userId: string;
      clinicId: string;
      role: ClinicStaffRole;
      firstRun: boolean;
    }
  | {
      kind: "owner";
      userId: string;
      firstRun: boolean;
      hasUnreadStaffReply: boolean;
      hasActiveRequest: boolean;
    };

export type RouterInput = {
  actor: RouterActor;
  nextParam: string | null;
  lastVisitedCookie: string | null;
};

export type RouterOutput = {
  destination: string;
  reason: RouterReason; // for `auth_events` audit row
};

export function resolvePostLoginDestination(input: RouterInput): RouterOutput;
```

Claude also provides a thin server adapter:

```ts
// apps/web/lib/auth/onboarding-progress.ts (Claude)
export async function loadActorFirstRunSignal(
  args: { actorKind: "clinic_staff" | "owner"; actorId: string }
): Promise<{ firstRun: boolean }>;
```

This adapter today returns a safe default `{ firstRun: true }` while Codex
schema lands. Codex must replace its implementation to read from the
`onboarding_progress` table / `onboarding_summary` view (see
`onboarding-progress.md`).

## What Codex must provide

### 1. Server helper `resolveStaffActor(userId)`

Reads from `clinic_staff` (already exists) and returns:

```ts
type StaffActor = {
  userId: string;
  clinicId: string;
  role: ClinicStaffRole;
  firstRun: boolean;
};
```

`firstRun` derived from `onboarding_progress` via the summary view.

### 2. Server helper `resolveOwnerActor(userId)`

Reads from `owner_user_memberships`, `request_events`, `messages` and returns:

```ts
type OwnerActor = {
  userId: string;
  firstRun: boolean;
  hasUnreadStaffReply: boolean;
  hasActiveRequest: boolean;
};
```

Definitions:
- `hasUnreadStaffReply` — at least one `messages.sender = 'staff'` row newer
  than `owner_user_memberships.last_seen_at` for any membership of this user.
- `hasActiveRequest` — exists a `requests` row for any membership where
  `status in ('new','urgent','waiting_owner','waiting_staff')`.
- `firstRun` — owner has no `done` row in `onboarding_progress` for the
  required step set `('welcome_dismissed','first_pet_added','first_thread_opened')`.

### 3. `auth_events` audit write (see `auth-audit-events.md`)

The router's `reason` field is intended to be logged alongside the redirect.
Codex's helper `writeAuthEvent({ event_type, actor_*, metadata: { reason, destination } })`
must be callable from both callback routes and `verifyOwnerOtp`.

### 4. Last-visited cookie source

The router accepts `lastVisitedCookie` as a sanitized string. Claude provides
`apps/web/lib/auth/last-route-cookie.ts` with helpers to read/write. Codex
owns nothing here — flagged for clarity.

## Acceptance criteria

- `resolveStaffActor` returns within p95 < 30ms for a warmed-up connection.
- `resolveOwnerActor` returns within p95 < 60ms (two reads across memberships).
- Both helpers respect RLS — failing reads bubble as errors that Claude's
  fallback page (`/auth/callback/error`) renders.
- `firstRun` flags flip back to `false` immediately when the relevant
  `onboarding_progress` row is upserted (no stale cache).

## Files Codex will touch

- `apps/web/lib/auth/onboarding-progress.ts` — replace TODO implementation.
- `apps/web/lib/auth/staff.ts` — extend `resolveStaffActor`.
- New `apps/web/lib/auth/owner-actor.ts` — `resolveOwnerActor`.
- `apps/web/app/auth/callback/route.ts` + `apps/web/app/o/auth/callback/route.ts`
  — already wired by Claude to call the router; Codex only swaps the actor
  loader from "safe-default adapter" to real resolver.
- `apps/web/app/o/login/actions.ts` `verifyOwnerOtp` — same swap.

## Hand-off note

Until Codex ships the resolvers, Claude's adapters return safe defaults
(`firstRun: true` for new actors after auth, `false` only when an explicit
`onboarding_progress` "done" row is supplied). The router itself is fully
implemented and unit-testable today.
