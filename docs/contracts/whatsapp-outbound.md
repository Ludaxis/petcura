# WhatsApp Outbound Reply Contract

Staff replies are always human-approved. AI drafts may eventually prefill the
textarea, but this contract only covers the staff click that sends a message.

## Staff Reply Flow

For non-WhatsApp requests, the existing behavior remains unchanged: PetCura
stores the staff reply in `messages`, updates the request to `waiting_owner`,
and writes `request_events.message_sent`.

For WhatsApp-originated requests:

1. Resolve the owner phone from the request owner.
2. Store the staff reply in `messages` with `external_id = null`.
3. Insert `outbound_messages` with `source = staff_reply`,
   `channel = whatsapp`, and `status = queued`.
4. Insert a queued `message_delivery_events` row with provider `twilio`.
5. Write `request_events.message_sent` with the outbox ID.
6. Emit `outbound.message.queued` for Inngest.

If the owner phone is missing, the action redirects with a delivery error and
does not persist a local staff reply. Twilio credentials and sender validation
happen in the worker, after the local message/outbox rows exist.

## Outbox Worker

The Inngest worker:

1. Claims the queued `outbound_messages` row.
2. Inserts `message_delivery_attempts`.
3. Resolves the sender from active `clinic_channels` where
   `channel = whatsapp`, falling back to `TWILIO_WHATSAPP_FROM`.
4. Sends through Twilio Programmable Messaging.
5. Stores the returned Twilio SID on `message_delivery_attempts.provider_message_sid`
   and, for compatibility, on `messages.external_id` when empty.

## Delivery Callback

Endpoint:

```text
POST /api/webhooks/twilio/status
```

Security:

- Requires `X-Twilio-Signature`.
- Validates the signature using `TWILIO_AUTH_TOKEN` and the reconstructed public
  webhook URL.

Mapping:

- `MessageSid` / `SmsSid` matches
  `message_delivery_attempts.provider_message_sid`.
- `MessageStatus` / `SmsStatus` maps to PetCura delivery statuses:
  - `accepted`, `queued`, other unknown states -> `queued`
  - `sending`, `sent` -> `sent`
  - `delivered` -> `delivered`
  - `read` -> `read`
  - `undelivered`, `failed` -> `failed`
- Each callback is upserted into `message_delivery_events` by
  `(provider, external_event_id)`.
- New callback events also write `request_events.message_delivery_{status}` for
  timeline visibility.

## Required Environment

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM` unless the clinic has a `clinic_channels` sender row
- `NEXT_PUBLIC_APP_URL` for the callback URL
- Optional SMS fallback: `PETCURA_SMS_FALLBACK_ENABLED=true` and
  `TWILIO_SMS_FROM` unless the clinic has an active SMS sender row

## Not In This Slice

- Template messages outside WhatsApp's customer-service window.
- Automatic owner-facing sends without staff approval.
