# Clinic Workflows

## Primary Request Flow

1. Owner sends WhatsApp message or uses clinic-scoped web intake.
2. PetCura creates or links owner and pet identity.
3. Web intake creates a real request after the first useful owner message, then AI organizes the case and asks safe clarification questions.
4. Request appears in clinic inbox.
5. Rule-based emergency language detection runs before/alongside AI and can show a conservative localized emergency banner.
6. Inngest runs AI summary, translations, and memory extraction after the request/message rows are durable.
7. AI suggests category, risk flags, routing target, service intent, summary, memory candidates, and optional on-demand reply draft.
8. Staff reviews memory candidates, confirms urgency, chooses final assignment, edits/approves reply, and assigns or resolves.
9. Staff creates reminder or export when needed.
10. Case timeline is preserved in `request_events`.

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
- review AI-assisted intake handoff
- mark resolved
- reopen
- export PDF/CSV

## AI-Assisted Web Intake

- The first screen collects owner name, phone, pet name/species, preferred language, and the free-text issue.
- `POST /api/intake/web/start` validates consent and clinic config, creates the request/message/session with server-side Supabase access, and returns the advisory intake output.
- The owner can add clarification answers through `POST /api/intake/web/message`; answers append to the same request/session.
- If AI is slow or unavailable, the owner can send without AI and the request still lands in the inbox.
- Suggested targets are advisory only: `reception`, `vet`, `tech`, `grooming`, `on_call`, or `general`.
- Grooming, delivery, walking, and boarding are captured as service intents or notes. V1 does not create marketplace, logistics, payment, sitter, or delivery workflows.

## AI Memory Workflow

- AI creates memory candidates only for the active request, linked pet, and linked owner.
- Staff can accept, edit and accept, reject, or ignore candidates.
- Accepted, non-expired memory can be retrieved for later staff-facing summaries and on-demand drafts.
- The request detail side panel shows accepted context and pending candidates with source counts.
- Drafts that use memory still only prefill the composer; staff must edit/approve before sending.
- Translation prompts do not use memory, so source wording remains faithful.

## Owner Channels

- WhatsApp is primary.
- Web intake is the clinic-owned AI-assisted fallback for owners who do not start in WhatsApp.
- SMS is fallback for failed WhatsApp delivery.
