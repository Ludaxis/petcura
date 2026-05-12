# AI Safety

## Allowed V1 AI Functions

- intake question generation
- category suggestion
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
- autonomous emergency routing without staff visibility
- auto-sent medical advice
- persistent medical profiling outside the active request
- owner-facing personalization from unreviewed memory

## Human Review

Staff approval is required for all owner-facing medical content. Intake clarification questions, cached translations, and staff-facing memory context may be generated without approval when they avoid advice, diagnosis, and prescription.

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

## Evals

AI changes require eval updates against anonymized clinic messages. Eval sets must cover English, Estonian, Russian, summaries, translations, category suggestions, risk flags, reply drafts, memory extraction, and context retrieval.
