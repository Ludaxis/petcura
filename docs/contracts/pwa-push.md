# PWA Push Notifications Contract

Web Push for the Owner PWA. iOS 16.4+, Android, desktop Chromium/Firefox. EU-resident subscription storage.

## Goal

Notify an owner when (a) staff replies to one of their open requests, (b) appointment status changes, or (c) a reminder lands — **only if** they installed the PWA, granted permission, and aren't currently viewing the thread.

## Owner

Codex (schema, dispatcher, VAPID rotation). Claude (subscription UI, opt-in flow, manifest, service worker).

## Schema

```sql
create table owner_push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  owner_id        uuid not null,
  clinic_id       uuid not null references clinics(id) on delete cascade,
  endpoint        text not null,
  p256dh_key      text not null,
  auth_key        text not null,
  user_agent      text,
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz,
  failure_count   int not null default 0,
  foreign key (clinic_id, owner_id) references owners(clinic_id, id)
);

create unique index owner_push_endpoint_uniq on owner_push_subscriptions(endpoint);
create index owner_push_owner on owner_push_subscriptions(owner_id);
```

## Triggers (Inngest jobs)

1. `messages.staff_reply_sent` → push to owner subs:
   ```json
   {
     "type": "new_message",
     "request_id": "...",
     "pet_name": "Luna",
     "title": "Clinic replied",
     "body": "Tap to read",
     "deep_link": "/o/chat/<request_id>"
   }
   ```
2. `appointments.status_changed` → on `confirmed | rescheduled | cancelled`.
3. `reminders.dispatched` → fallback push if WhatsApp delivery failed.

## Suppression

Skip push if:
- Owner is currently viewing the matching deep-link (Supabase Realtime presence channel).
- Same `external_event_id` sent in last 30s (dedupe).
- Owner toggled "Pause notifications" in `/o/me`.

## Failures

- 410 Gone → delete subscription.
- 4xx → increment `failure_count`; delete after 5 consecutive.
- 5xx → exponential backoff (1m, 5m, 30m).

## VAPID

- Generated per environment.
- Env: `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`.
- Rotation runbook: `docs/runbooks/vapid-rotation.md` (TBD).

## UX (Claude)

- `<InstallPrompt />` — only after first successful staff reply received via PWA. Copy: "Install PetCura to get notified when {Clinic} replies."
- `<PushOptInBanner />` — after first thread view if `Notification.permission === 'default'`. Copy: "Get a notification when {Clinic} replies. You can turn this off any time."
- Service worker `apps/web/app/sw.ts` handles `push` → `showNotification` → click → `clients.openWindow(deep_link)`.
- `/o/me` toggle pauses all push (writes `owner_users.push_paused_until`).

## Test plan

- Unit: dedup window, suppression by presence, 410 cleanup.
- Integration: end-to-end push via `web-push` test harness.
- Isolation: subscription per owner; staff cannot enumerate.
- Manual: iOS 17 Safari "Add to Home Screen" → notification arrives in <5s.

## Out of scope

- SMS as push fallback (already in WhatsApp/SMS pipeline).
- Rich push (image, action buttons) v1.5.
- Per-pet notification preferences.

## Done when

- Push lands on iOS, Android, desktop Chrome in <5s p95.
- Subscriptions cleaned up on 410.
- Suppression rules verified.
- Lighthouse PWA 100 with valid manifest + SW.
