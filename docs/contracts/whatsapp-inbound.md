# WhatsApp Inbound Contract

Endpoint:

```text
POST /api/webhooks/twilio/whatsapp
```

Provider: Twilio WhatsApp Business.

## Security

- Requests must include `X-Twilio-Signature`.
- The route validates the signature with the official Twilio SDK and
  `TWILIO_AUTH_TOKEN`.
- The signed URL is reconstructed from `x-forwarded-proto`,
  `x-forwarded-host`, path, and query string so Vercel/proxy deployments still
  validate against the public webhook URL.
- Missing or invalid signatures return `401`.

## Inbound Mapping

Twilio form fields:

- `From`: owner WhatsApp address, normalized from `whatsapp:+...` to `+...`
- `To`: clinic WhatsApp address, normalized the same way
- `Body`: initial owner message
- `MessageSid` or `SmsMessageSid`: stored as `messages.external_id`
- `ProfileName`: owner display name fallback
- `NumMedia`, `MediaUrl{n}`, `MediaContentType{n}`: stored as attachment
  metadata rows linked to the initial message

Clinic resolution:

1. Match `clinic_channels` where `channel = whatsapp`,
   `external_id = To`, and `is_active = true`.
2. If no channel mapping exists, fall back to `PETCURA_DEFAULT_CLINIC_SLUG`.

Request creation:

- `owners` is upserted by `(clinic_id, phone)`.
- `owner_channel_identities` is upserted by `(clinic_id, channel, external_id)`.
- A placeholder pet `Unknown pet` / `unknown` is used until structured intake
  collects pet identity.
- A `requests` row is created with:
  - `channel = whatsapp`
  - `category = medical_question`
  - `status = new`
  - `urgency = low`
- The first owner message is stored in `messages`.
- `request_events.created` and `request_events.message_received` are written.
- Attachment metadata is stored in `attachments` using a Twilio storage path
  placeholder (`twilio/{messageSid}/{index}`) until media download/storage is
  enabled.
- `audit_logs.owner_request_created` records the system-side intake action.

Idempotency:

- If a message with the same `external_id` already exists for the clinic, the
  webhook returns success without creating a duplicate request.

Response:

- Success returns empty TwiML: `<Response></Response>`.
- PetCura does not auto-send medical advice from this webhook.

## Next Iteration

- Category suggestion from message text.
- Structured intake follow-up questions.
- Media download into Supabase Storage and malware/content checks.
- Owner language detection for EN/ET/RU instead of clinic-locale fallback.
- Outbound WhatsApp staff replies from request detail.
