# Inngest AI Events Contract

PetCura AI Memory V1 uses Inngest events as ID-only job triggers. Event payloads
must not include message bodies, owner free text, clinic secrets, or generated AI
content. Workers load durable context by `clinicId`, `requestId`, and message IDs.

## Events

| Event name | Type | Purpose |
| --- | --- | --- |
| `owner.message.created` | `OwnerMessageCreatedEventData` | Emitted after an owner message row and timeline event are durable. |
| `ai.summary.requested` | `AiSummaryRequestedEventData` | Requests staff-facing request summary generation. |
| `ai.translation.requested` | `AiTranslationRequestedEventData` | Requests cached translations for one message. Missing `targetLocales` means all supported locales except the source locale. |
| `ai.memory_extraction.requested` | `AiMemoryExtractionRequestedEventData` | Requests memory extraction for owner, pet, or request facts. Missing `scopes` means the worker chooses the safe default scopes. |
| `ai.reply_draft.requested` | `AiReplyDraftRequestedEventData` | Requests a staff-reviewed reply draft. Drafts are never auto-sent. |

## Rules

- `clinicId` and `requestId` are required on every payload.
- AI requested events include `requestedAt` and `requestedBy`.
- Use `idempotencyKey` or the Inngest top-level event `id` when retries could
  duplicate work.
- AI outputs remain accountable through `ai_outputs`; request timeline changes
  remain accountable through `request_events`.
