# WhatsApp Outbound Reply Contract

Staff replies are always human-approved. AI drafts may eventually prefill the
textarea, but this contract only covers the staff click that sends a message.

## Staff Reply Flow

For non-WhatsApp requests, the existing behavior remains unchanged: PetCura
stores the staff reply in `messages`, updates the request to `waiting_owner`,
and writes `request_events.message_sent`.

For WhatsApp-originated requests:

1. Resolve the owner phone from the request owner.
2. Resolve the sender from active `clinic_channels` where
   `channel = whatsapp`, falling back to `TWILIO_WHATSAPP_FROM`.
3. Send a freeform WhatsApp reply through Twilio Programmable Messaging.
4. Store the returned Twilio message SID in `messages.external_id`.
5. Insert an initial `message_delivery_events` row with provider `twilio`.
6. Write `request_events.message_sent` with channel and delivery metadata.

If Twilio credentials or a sender are missing, the action redirects with a
delivery error and does not persist a local staff reply.

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

- `MessageSid` / `SmsSid` matches `messages.external_id`.
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

## Not In This Slice

- SMS fallback after WhatsApp failure.
- Template messages outside WhatsApp's customer-service window.
- Retry/outbox durability for transient Twilio failures.
- Delivery status badges in the conversation UI.
