# Message Delivery Contract

## Channels

- `whatsapp`
- `sms`
- `web`
- `system`

## Outbound Lifecycle

`message_delivery_events.status`:

- `queued`
- `sent`
- `delivered`
- `read`
- `acknowledged`
- `failed`

`outbound_messages.status`:

- `queued`
- `sending`
- `dispatched`
- `delivered`
- `read`
- `failed`
- `cancelled`

## Rules

- Outbound sends must create `messages` and `outbound_messages` before Twilio is
  called.
- Each provider send creates `message_delivery_attempts`.
- Twilio callbacks resolve by `message_delivery_attempts.provider_message_sid`,
  not by `messages.external_id`.
- Outbound messages write display state to `message_delivery_events`.
- WhatsApp delivery failures may trigger SMS fallback only when fallback is
  configured and owner SMS consent exists.
- Provider webhook events must be idempotent by external event ID.
- Staff UI should show delivery state without blocking request workflow.
- Reminder success is measured by delivery and acknowledgement separately.
