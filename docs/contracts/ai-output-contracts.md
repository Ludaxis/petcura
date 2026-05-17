# AI Output Contracts

Last updated: 2026-05-15.

## Kinds

- `intake_question`
- `summary`
- `summary_translation`
- `reply_draft`
- `translation`
- `category_suggestion`
- `risk_flags`
- `memory_extraction`
- `context_retrieval`

## Required Metadata

- `clinic_id`
- `request_id`
- `kind`
- `status`: `success`, `fallback`, `schema_failure`, `provider_error`, or `blocked`
- `provider`
- `model`
- `prompt_key`
- `prompt_version`
- `prompt_hash`
- `input_json`
- `output_json`
- `tokens_in`
- `tokens_out`
- `latency_ms`
- `confidence`
- `created_at`

## Review Fields

- `review_status`: `pending`, `accepted`, `accepted_with_edits`, `edited`, `rejected`, or `not_reviewable`
- `reviewed_by`
- `reviewed_at`
- `accepted`
- `edited_output_json`
- `review_notes`

Failure rows use `review_status = not_reviewable`.

## Provenance Fields

- `failure_reason`
- `blocked_reason`
- `raw_output_text`
- `provenance_json`
- `ai_output_sources[]`

`ai_output_sources` stores source row references for each accountable output:
`request`, `message`, `internal_note`, `ai_output`, `ai_memory_item`, `owner`,
`pet`, `appointment`, `appointment_slot_offer`, `service`, or
`web_intake_session`.

## Rules

- Prompt changes require version bumps.
- Prompt material is hashed with SHA-256 using `prompt_key`, `prompt_version`,
  system text, and user prompt text. The hash is stored on `ai_outputs.prompt_hash`
  and repeated in `input_json.prompt_hash`.
- Structured outputs must pass schema validation.
- Failed validation writes `status = schema_failure`. If a rules fallback is
  available, the fallback also writes `status = fallback`.
- Provider errors write `status = provider_error` unless a task has a rules
  fallback, in which case the used fallback writes `status = fallback` with
  `failure_reason`.
- Safety-blocked model outputs write `status = blocked`. If a rules fallback is
  available, the fallback output is written as a separate `fallback` row linked
  through `ai_output_sources`.
- AI output is advisory unless a human review field marks it accepted.
- Provider credentials:
  - `AI_GATEWAY_API_KEY` is for Vercel AI Gateway.
  - `ANTHROPIC_API_KEY` is for a direct Anthropic Console key.
  - Direct Anthropic calls map `anthropic/claude-haiku-4.5` to Claude API alias `claude-haiku-4-5`.

## Intake Question V1

- Prompt version: `intake-question-v1.0.0`
- Default model: `PETCURA_AI_INTAKE_MODEL` or `anthropic/claude-haiku-4.5`
- Trigger: owner starts or continues clinic-scoped web intake
- Storage:
  - `ai_outputs.kind = intake_question`
  - `output_json.categorySuggestion`
  - `output_json.serviceIntent`
  - `output_json.routingSuggestion`
  - `output_json.urgencySuggestion`
  - `output_json.emergencySignal`
  - `output_json.riskFlags[]`
  - `output_json.missingFields[]`
  - `output_json.clarifyingQuestions[]`
  - `output_json.handoffSummary`
  - `output_json.confidence`
  - `output_json.safetyNotes[]`
  - `requests.urgency_suggestion`
  - `requests.risk_flags_json`
  - `requests.routing_suggestion`
  - `requests.service_intent`
  - `requests.intake_ai_output_id`
  - `requests.web_intake_session_id`
- Routing targets: `reception`, `vet`, `tech`, `grooming`, `on_call`, `general`
- Service intents: `medical`, `appointment`, `refill`, `follow_up`, `admin`, `grooming`, `delivery`, `walking`, `boarding`, `other`, `unknown`
- Safety:
  - Output is advisory and visible to staff as an intake handoff.
  - Rule-based emergency language detection runs before/alongside AI and overrides to high urgency suggestion plus `on_call` routing when triggered.
  - The public owner UI may show conservative emergency banner copy, but not diagnosis, prescription, or treatment instructions.
  - Grooming, delivery, walking, and boarding are route-only intents in V1; no marketplace, provider matching, logistics, payment, sitter, or boarding operation is created.
  - If AI Gateway is unavailable or disabled, PetCura writes a rules fallback output with model `petcura/rules-fallback`.

## Summary V1

- Prompt version: `summary.v1.2026-05-11`
- Default model: `PETCURA_AI_SUMMARY_MODEL` or `anthropic/claude-haiku-4.5`
- Trigger: new owner message created by web intake or WhatsApp intake
- Storage:
  - `ai_outputs.kind = summary`
  - `requests.ai_summary`
  - `requests.ai_summary_version`
  - `requests.urgency_suggestion`
  - `requests.risk_flags_json`
- Safety:
  - Output is staff-facing only.
  - Urgency remains a suggestion; staff-owned `requests.urgency` is not changed.
  - If AI Gateway is unavailable, PetCura writes a conservative fallback summary with model `petcura/rules-fallback`.

## Translation V1

- Prompt version: `translation.v1.2026-05-11`
- Default model: `PETCURA_AI_TRANSLATION_MODEL` or `anthropic/claude-haiku-4.5`
- Trigger: new owner message created by web intake or WhatsApp intake
- Targets: all supported UI locales except the source locale (`en`, `et`, `ru`)
- Storage:
  - `ai_outputs.kind = translation`
  - `message_translations`
  - legacy `messages.body_translated` only for English fallback compatibility
- Safety:
  - Translations must preserve uncertainty and never add advice.
  - Translation reveal audit remains a staff action through `request_events.translation_revealed`.

## Summary Translation V1

- Prompt version: `summary_translation.v1.2026-05-12`
- Default model: `PETCURA_AI_SUMMARY_TRANSLATION_MODEL`, `PETCURA_AI_TRANSLATION_MODEL`, or `anthropic/claude-haiku-4.5`
- Trigger: staff requests a localized summary view
- Storage:
  - `ai_outputs.kind = summary_translation`
  - `requests.ai_summary_translations_json`
- Safety:
  - Summary translations must preserve clinical uncertainty and urgency language.
  - Staff edits are stored as localized summary entries and do not rewrite the source summary.

## Memory Extraction V1

- Prompt version: `memory_extraction.v1.2026-05-12`
- Default model: `PETCURA_AI_MEMORY_MODEL` or `anthropic/claude-haiku-4.5`
- Trigger: new request data that may affect staff-facing AI context
- Storage:
  - `ai_outputs.kind = memory_extraction`
  - `output_json.candidates[]`
  - each candidate includes scope, memory type, text, source IDs, confidence, optional source locale, and optional expiry
  - candidate rows are stored in `ai_memory_items`
  - source provenance rows are stored in `ai_memory_sources`
- Safety:
  - Output is staff-facing only.
  - Facts must be grounded in request-scoped source rows.
  - Facts must not diagnose, prescribe, or set final urgency.
  - Rejected or failed AI outputs must not become trusted facts.

## Context Retrieval V1

- Prompt version: `context_retrieval.v1.2026-05-12`
- Default model: `PETCURA_AI_MEMORY_MODEL` or `anthropic/claude-haiku-4.5`
- Trigger: AI task needs accepted prior context for summary, reply draft, or follow-up assistance
- Storage:
  - `ai_outputs.kind = context_retrieval`
  - `output_json.selectedMemoryIds[]`
  - `output_json.contextItems[]`
  - `output_json.promptContextHash`
- Safety:
  - Retrieval is scoped to one `clinic_id` and the active request's `request`, `pet`, and `owner` memory scopes.
  - Retrieved context is advisory and must be visible through source references or audit detail.
  - Owner-facing medical content that uses retrieved context still requires staff approval.
  - Translation prompts intentionally do not use memory so source wording stays faithful.

## Reply Draft V2

- Prompt version: `reply_draft.v2.2026-05-17`
- Default model: `PETCURA_AI_REPLY_DRAFT_MODEL` or `anthropic/claude-haiku-4.5`
- Trigger: staff clicks generate or regenerate draft on request detail
- Storage:
  - `ai_outputs.kind = reply_draft`
  - `ai_outputs.status = success | schema_failure | provider_error | blocked`
  - `input_json.source_locale`
  - `input_json.target_locale`
  - `input_json.context_retrieval_ai_output_id`
  - `input_json.memory_ids`
  - `input_json.appointment_context` when request category is `appointment`
  - `output_json.text`
  - `output_json.usedMemoryIds[]`
  - `output_json.safetyNotes[]`
- Safety:
  - Drafts are never sent automatically.
  - Drafts can use accepted memory only as prior context, not as current symptoms.
  - Appointment drafts may only mention slots from the current appointment context
    or active staff-sent offers.
  - Appointment drafts must never invent availability or say a booking is confirmed
    unless the appointment row is already `confirmed` or `rescheduled`.
  - Staff accept, edit-and-accept, or reject remains the human approval path.
  - Draft stream endpoints only stream the exact persisted `ai_outputs.id`
    requested by the client; missing `draftId` disables streaming and falls
    back to the already-loaded persisted text.
