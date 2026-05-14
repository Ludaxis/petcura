# AI Safety

Last updated: 2026-05-14.

## Allowed V1 AI Functions

- intake question generation
- category suggestion
- routing suggestion
- route-only service intent detection
- conservative emergency language detection and owner-visible emergency banner copy
- risk flag suggestion
- conversation summary
- reply draft
- translation
- request-scoped memory extraction
- context retrieval for staff-facing AI assistance

## Prohibited V1 AI Functions

- diagnosis
- prescription
- final urgency setting
- autonomous emergency routing or auto-assignment
- auto-sent medical advice
- persistent medical profiling outside the active request
- owner-facing personalization from unreviewed memory

## Human Review

Staff approval is required for all owner-facing medical content. Intake clarification questions, conservative emergency banners, cached translations, and staff-facing memory context may be generated without approval when they avoid advice, diagnosis, and prescription.

AI-assisted web intake may ask non-medical questions like timing, symptoms noticed by the owner, medication names, service preference, and contact details. It may not tell the owner what treatment to perform, promise appointment availability, or decide the final urgency/assignee.

AI memory is a reviewed staff aid. The model creates candidates, but accepted memory only enters future context after staff accept or edit-and-accept it. On-demand reply drafts can use accepted memory, but they only prefill the composer and are never sent automatically.

## Logging

Every AI output must write:

- kind
- model
- prompt version
- input JSON
- output JSON
- token usage
- latency
- confidence
- reviewer
- accepted/rejected status
- edited output when changed
- source references for memory extraction and context retrieval

For reply drafts, `ai_outputs.input_json` also records `source_locale`, `target_locale`, `context_retrieval_ai_output_id`, and retrieved `memory_ids` so staff-visible draft metadata and audits stay aligned.

For web intake, `ai_outputs.kind = intake_question` records the public session, request/message IDs, rule-based emergency signals, open/closed-hours context, service intent, advisory route, missing fields, clarification questions, handoff summary, and safety notes. `request_events` records session start, AI intake suggestion creation, and emergency banner display.

## Evals

AI changes require eval updates against anonymized clinic messages. Eval sets must cover English, Estonian, Russian, summaries, translations, intake questions, category suggestions, service intents, emergency signals, risk flags, reply drafts, memory extraction, and context retrieval.

AI Memory V1 eval coverage includes safe extraction, source-grounded context retrieval, safe summary and draft behavior, stale or contradictory memory, translation preservation, and cross-tenant leak sentinels.
