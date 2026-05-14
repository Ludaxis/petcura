# `onboarding_progress` Table — Contract

> Owner: Codex (migration, RLS, write helpers). Claude consumes via the typed
> adapter in `apps/web/lib/auth/onboarding-progress.ts`.
> Companion to merged plan §9.6.

## Problem

Both the post-login router (Pillar 0) and three first-run surfaces (Pillars
2a / 2b / 3) need a durable record of which onboarding steps a given actor
has completed. The merged plan collapsed Codex's initial three-table proposal
into a single `onboarding_progress` table keyed by `(actor_kind, actor_id, step)`.

## Schema

```sql
create table onboarding_progress (
  actor_kind   text not null check (actor_kind in ('clinic_owner','clinic_staff','owner')),
  actor_id     uuid not null,
  clinic_id    uuid,
  step         text not null,
  status       text not null check (status in ('todo','done','skipped')) default 'todo',
  completed_at timestamptz,
  metadata     jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  primary key (actor_kind, actor_id, step)
);

create index onboarding_progress_actor_idx
  on onboarding_progress (actor_kind, actor_id);

create index onboarding_progress_clinic_idx
  on onboarding_progress (clinic_id)
  where clinic_id is not null;
```

### Required-step sets (Claude relies on these)

| Actor kind        | Required steps (frontend checks `done`)                                  |
|-------------------|--------------------------------------------------------------------------|
| `clinic_owner`    | `connect_whatsapp`, `choose_pms`, `invite_teammate`, `quiet_hours`, `test_request` |
| `clinic_staff`    | `profile_complete`, `notifications_set`                                  |
| `owner`           | `welcome_dismissed`                                                      |

Step names are stable contract values. Claude's `onboarding-progress.ts`
adapter exports them as a typed union — Codex must not rename them.

### View `onboarding_summary`

```sql
create view onboarding_summary as
select
  actor_kind,
  actor_id,
  clinic_id,
  array_agg(step) filter (where status = 'done')    as done_steps,
  array_agg(step) filter (where status = 'skipped') as skipped_steps,
  array_agg(step) filter (where status = 'todo')    as todo_steps,
  bool_and(status = 'done' or status = 'skipped')   as all_resolved
from onboarding_progress
group by actor_kind, actor_id, clinic_id;
```

`is_first_run(actor_kind, actor_id)` server helper returns true when no `done`
row exists for the actor in their required-step set.

## RLS

- `clinic_staff` rows: readable + writable only by staff with admin role at
  the same `clinic_id`, plus the actor themselves.
- `clinic_owner` rows: same.
- `owner` rows: readable + writable only by the owner themselves.

## Adapter API (Claude side)

`apps/web/lib/auth/onboarding-progress.ts`:

```ts
export type ClinicOwnerStep =
  | "connect_whatsapp"
  | "choose_pms"
  | "invite_teammate"
  | "quiet_hours"
  | "test_request";

export type ClinicStaffStep = "profile_complete" | "notifications_set";
export type OwnerStep = "welcome_dismissed";

export type OnboardingProgressRow = {
  step: string;
  status: "todo" | "done" | "skipped";
  completedAt: string | null;
};

export async function loadOnboardingProgress(args: {
  actorKind: "clinic_owner" | "clinic_staff" | "owner";
  actorId: string;
  clinicId?: string;
}): Promise<OnboardingProgressRow[]>;

export async function markOnboardingStep(args: {
  actorKind: "clinic_owner" | "clinic_staff" | "owner";
  actorId: string;
  clinicId?: string;
  step: string;
  status: "todo" | "done" | "skipped";
  metadata?: Record<string, unknown>;
}): Promise<void>;

export async function loadActorFirstRunSignal(args: {
  actorKind: "clinic_staff" | "owner";
  actorId: string;
}): Promise<{ firstRun: boolean }>;
```

Until Codex ships the table, the adapter returns `firstRun: true` and writes
are no-ops with a console warning (gated by `NODE_ENV !== 'production'`).

## Acceptance criteria

- Upsert by `(actor_kind, actor_id, step)` is atomic.
- `is_first_run` returns `false` for actors with any required step `done`.
- `markOnboardingStep` always sets `updated_at = now()` and `completed_at`
  when status flips to `done`.
- Frontend can call `markOnboardingStep` with `status: 'skipped'` without
  blocking completion of the rest of the set.

## Out of scope here

- Activation analytics events fire after `markOnboardingStep`. See
  `activation-events.md`.
