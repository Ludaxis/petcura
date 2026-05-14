# Activation Events Taxonomy — Contract

> Owner: Codex (PostHog registration, server-side firing helpers). Claude
> fires events via a typed adapter from the relevant server action / route.
> Companion to merged plan §9.7.

## Why

Four moments matter for activation. Each must fire exactly once per actor.

## Events

| Event name                    | Fired when                                                      | Actor   |
|-------------------------------|------------------------------------------------------------------|---------|
| `clinic_connected_whatsapp`   | Clinic admin marks `connect_whatsapp` step `done`                | admin   |
| `staff_first_reply_sent`      | A `clinic_staff` user sends their first inbox reply              | staff   |
| `owner_first_thread_opened`   | An owner opens a request thread for the first time post-onboard  | owner   |
| `owner_push_enabled`          | Owner accepts the PWA push prompt (per `pwa-push.md`)            | owner   |

## Adapter Claude calls

`apps/web/lib/auth/activation-events.ts`:

```ts
export type ActivationEvent =
  | "clinic_connected_whatsapp"
  | "staff_first_reply_sent"
  | "owner_first_thread_opened"
  | "owner_push_enabled";

export async function fireActivationEvent(args: {
  event: ActivationEvent;
  actorId: string;
  clinicId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void>;
```

Until Codex ships, the adapter no-ops with a console.info in development.

## Idempotency

Each event must fire **at most once** per actor. Codex enforces via a small
`activation_event_log(actor_id, event_name, fired_at)` table with a unique
key on `(actor_id, event_name)`. The adapter is safe to call repeatedly.

## Frontend callsites

- `apps/web/app/onboarding/clinic/actions.ts` `markStepDone` — fire
  `clinic_connected_whatsapp` when the `connect_whatsapp` step is the one
  flipped to `done`.
- `apps/web/app/inbox/[id]/actions.ts` (Codex-owned today) reply action —
  fire `staff_first_reply_sent`. Out of Claude scope.
- `apps/web/app/o/chat/[id]/page.tsx` open — fire `owner_first_thread_opened`.
  Wired by Claude when the chat route gates on `firstRun`.
- `apps/web/components/owner/push-prompt.tsx` (existing per `pwa-push.md`)
  fires `owner_push_enabled`. Existing; not in this round's scope.

## Acceptance criteria

- Each event recorded in PostHog with `distinct_id = actor user id`.
- Replay: calling the adapter twice for the same actor + event records once.
- Failure to write does not block user flow.
