# AI Output Contracts

## Kinds

- `intake_question`
- `summary`
- `reply_draft`
- `translation`
- `category_suggestion`
- `risk_flags`

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
