# Twilio Media Ingestion Contract

## Purpose

Inbound WhatsApp webhooks must stay fast. They store Twilio media metadata and
queue download/storage work asynchronously.

## Attachment Fields

Twilio media attachments use:

- `provider = twilio`
- `provider_media_id` when it can be parsed from the URL
- `ingestion_status = queued | processing | completed | failed | skipped`
- `ingestion_attempts`, `ingestion_error`, `ingestion_queued_at`,
  `ingestion_completed_at`

`MediaUrl{n}` values are stored only in the service-role table
`public.twilio_media_ingestion_jobs.provider_url`. That table has RLS enabled
and grants no access to `anon` or `authenticated`. Provider URLs must not be
stored on `public.attachments` because owners can read their attachment rows
through RLS.

The initial `storage_path` is `twilio/{messageSid}/{index}`.

## Worker

The webhook emits `twilio.media_ingestion.requested` with the attachment ID.
The Inngest worker downloads the media using Twilio basic auth, uploads it to
the `request-attachments` Supabase Storage bucket, then updates size, MIME type,
and ingestion status.

Failures leave the attachment row linked to the message and write
`request_events.attachment_ingestion_failed` for auditability.
