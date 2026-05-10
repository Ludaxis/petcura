# Message Delivery Contract

## Channels

- `whatsapp`
- `sms`
- `web`
- `system`

## Outbound Lifecycle

- `queued`
- `sent`
- `delivered`
- `read`
- `acknowledged`
- `failed`

## Rules

- Outbound messages write delivery events to `message_delivery_events`.
- WhatsApp delivery failures may trigger SMS fallback when owner consent and clinic settings allow it.
- Provider webhook events must be idempotent by external event ID.
- Staff UI should show delivery state without blocking request workflow.
- Reminder success is measured by delivery and acknowledgement separately.
