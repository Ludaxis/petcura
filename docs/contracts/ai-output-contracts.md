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
