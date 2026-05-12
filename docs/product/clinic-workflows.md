# Clinic Workflows

## Primary Request Flow

1. Owner sends WhatsApp message or uses web intake.
2. PetCura creates or links owner and pet identity.
3. Intake collects 3-5 structured details when needed.
4. Request appears in clinic inbox.
5. Inngest runs AI summary, translations, and memory extraction after the request/message rows are durable.
6. AI suggests category, risk flags, summary, memory candidates, and optional on-demand reply draft.
7. Staff reviews memory candidates, confirms urgency, edits/approves reply, and assigns or resolves.
8. Staff creates reminder or export when needed.
9. Case timeline is preserved in `request_events`.

## Staff Inbox States

- New
- Urgent
- Waiting Staff
- Waiting Owner
- Resolved

## Staff Actions

- reply
- assign
- set urgency
- create reminder
- add internal note
- review AI memory candidate
- generate or regenerate AI draft
- mark resolved
- reopen
- export PDF/CSV

## AI Memory Workflow

- AI creates memory candidates only for the active request, linked pet, and linked owner.
- Staff can accept, edit and accept, reject, or ignore candidates.
- Accepted, non-expired memory can be retrieved for later staff-facing summaries and on-demand drafts.
- The request detail side panel shows accepted context and pending candidates with source counts.
- Drafts that use memory still only prefill the composer; staff must edit/approve before sending.
- Translation prompts do not use memory, so source wording remains faithful.

## Owner Channels

- WhatsApp is primary.
- Web intake is fallback.
- SMS is fallback for failed WhatsApp delivery.
