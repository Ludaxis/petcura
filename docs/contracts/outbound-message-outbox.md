# Outbound Message Outbox Contract

## Purpose

All staff replies, reminder messages, and configured SMS fallbacks are persisted
before a provider send is attempted. Twilio is called only by the Inngest worker.

## Tables

- `outbound_messages`: durable outbox row scoped by `clinic_id`.
- `message_delivery_attempts`: one row per provider send attempt.
- `message_delivery_events`: UI/timeline delivery state, still keyed
  idempotently by `(provider, external_event_id)`.

## Flow

1. Caller creates the local `messages` row.
2. Caller inserts `outbound_messages` with `status = queued`.
3. Caller writes a queued `message_delivery_events` row when a message exists.
4. Caller emits `outbound.message.queued`.
5. Inngest claims the outbox row, inserts `message_delivery_attempts`, and sends
   Twilio.
6. Twilio callback updates the attempt by `provider_message_sid`.

## SMS Fallback

SMS fallback is disabled unless `PETCURA_SMS_FALLBACK_ENABLED=true`.

Fallback also requires:

- Twilio credentials.
- An SMS sender from active `clinic_channels` or `TWILIO_SMS_FROM`.
- An owner `owner_channel_identities` row for `channel = sms` with
  `consented_at` set and `opted_out_at` unset.

Each WhatsApp outbox row can create at most one SMS fallback row.
