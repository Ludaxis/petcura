# Clinic Workflows

## Primary Request Flow

1. Owner sends WhatsApp message or uses web intake.
2. PetCura creates or links owner and pet identity.
3. Intake collects 3-5 structured details when needed.
4. Request appears in clinic inbox.
5. AI suggests category, risk flags, summary, and optional reply draft.
6. Staff confirms urgency, edits/approves reply, and assigns or resolves.
7. Staff creates reminder or export when needed.
8. Case timeline is preserved in `request_events`.

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
- mark resolved
- reopen
- export PDF/CSV

## Owner Channels

- WhatsApp is primary.
- Web intake is fallback.
- SMS is fallback for failed WhatsApp delivery.
