-- Harden provider webhook idempotency and open-channel lookups.
--
-- `external_id` stores provider message IDs such as Twilio MessageSid.
-- It is nullable for local-only/system messages, so uniqueness is scoped to
-- non-null provider IDs within a clinic.

create unique index if not exists messages_clinic_external_id_unique_idx
  on public.messages (clinic_id, external_id)
  where external_id is not null;
create index if not exists requests_open_owner_channel_idx
  on public.requests (clinic_id, owner_id, channel, updated_at desc)
  where status <> 'resolved';
