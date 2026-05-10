# AI Safety

## Allowed V1 AI Functions

- intake question generation
- category suggestion
- risk flag suggestion
- conversation summary
- reply draft
- translation

## Prohibited V1 AI Functions

- diagnosis
- prescription
- final urgency setting
- autonomous emergency routing without staff visibility
- auto-sent medical advice

## Human Review

Staff approval is required for all owner-facing medical content. Intake clarification questions and cached translations may be generated without approval when they avoid advice, diagnosis, and prescription.

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

## Evals

AI changes require eval updates against anonymized clinic messages. Eval sets must cover English, Estonian, Russian, summaries, translations, category suggestions, risk flags, and reply drafts.
