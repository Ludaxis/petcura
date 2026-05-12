# AI Output Contracts

## Kinds

- `intake_question`
- `summary`
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
- `model`
- `prompt_version`
- `input_json`
- `output_json`
- `tokens_in`
- `tokens_out`
- `latency_ms`
- `confidence`
- `created_at`

## Review Fields

- `reviewed_by`
- `accepted`
- `edited_output_json`

## Rules

- Prompt changes require version bumps.
- Structured outputs must pass schema validation.
- Failed validation falls back to manual UI and logs the failure.
- AI output is advisory unless a human review field marks it accepted.
- Provider credentials:
  - `AI_GATEWAY_API_KEY` is for Vercel AI Gateway.
  - `ANTHROPIC_API_KEY` is for a direct Anthropic Console key.
  - Direct Anthropic calls map `anthropic/claude-haiku-4.5` to Claude API alias `claude-haiku-4-5`.

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

## Memory Extraction V1

- Prompt version: `memory_extraction.v1.2026-05-12`
- Default model: `PETCURA_AI_MEMORY_MODEL` or `anthropic/claude-haiku-4.5`
- Trigger: new request data that may affect staff-facing AI context
- Storage:
  - `ai_outputs.kind = memory_extraction`
  - `output_json.facts[]`
  - each fact includes source type, source ID, confidence, and optional expiry
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
  - `output_json.selected_fact_ids[]`
  - `output_json.source_refs[]`
  - `output_json.prompt_context_hash`
- Safety:
  - Retrieval is scoped to one `clinic_id` and the active request's `request`, `pet`, and `owner` memory scopes.
  - Retrieved context is advisory and must be visible through source references or audit detail.
  - Owner-facing medical content that uses retrieved context still requires staff approval.
  - Translation prompts intentionally do not use memory so source wording stays faithful.
