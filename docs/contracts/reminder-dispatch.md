# Reminder Dispatch Contract

## Trigger

Vercel Cron calls `GET /api/cron/reminders` every five minutes in production.
The route requires `Authorization: Bearer $CRON_SECRET`.

## Eligible Reminders

A reminder is eligible when:

- `status = scheduled`
- `due_at <= now()`
- retry window has elapsed since `last_send_attempt_at`

The dispatch job claims a reminder by incrementing `send_attempts` and setting
`last_send_attempt_at`.

## Delivery

v1 queues owner reminders through WhatsApp only. A successful dispatch:

- creates a `messages` row with `sender_type = system`
- inserts an `outbound_messages` row with `source = reminder`
- inserts the initial queued `message_delivery_events` row
- updates the reminder to `status = sent`
- writes `request_events.reminder_sent`

Inngest sends the queued outbox row through Twilio. Twilio status callbacks
continue to update delivery lifecycle through `/api/webhooks/twilio/status`.

## Failure

Dispatch-time validation failures keep the reminder `scheduled` until the
maximum attempt count is reached. After the final claim failure the reminder
becomes `missed`.
Each failure stores `last_send_error` and writes `request_events.reminder_send_failed`
when the reminder belongs to a request.

Provider failures after the outbox is queued are tracked on
`message_delivery_attempts`, `message_delivery_events`, and
`outbound_messages.last_error`.
