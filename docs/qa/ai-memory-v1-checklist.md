# AI Memory V1 QA Checklist

## Contract

- [ ] `memory_extraction` writes an `ai_outputs` row with model, prompt version, input, output, confidence, token usage, latency, and validation status.
- [ ] `context_retrieval` writes an `ai_outputs` row with selected source references and `prompt_context_hash`.
- [ ] Invalid structured output falls back to non-memory-assisted staff workflow.
- [ ] Rejected or failed AI outputs are not reused as trusted memory facts.

## Tenant Isolation

- [ ] Memory extraction only reads rows for the active `clinic_id`.
- [ ] Context retrieval cannot return facts from another clinic.
- [ ] Anonymous users cannot read memory outputs or source rows.
- [ ] RLS/security tests cover memory reads and `ai_outputs` writes.

## Safety

- [ ] Extracted facts are source-grounded and cite row IDs.
- [ ] Memory never sets final urgency.
- [ ] Memory never generates diagnosis, prescription, or treatment instructions.
- [ ] Owner-facing medical drafts that use memory require staff approval before send.
- [ ] Time-bound facts include `expires_at` or are omitted from memory.

## Compliance

- [ ] AI provider payloads include the minimum necessary source excerpts.
- [ ] Owner data export includes `memory_extraction` and `context_retrieval` outputs when they contain owner or pet data.
- [ ] Erasure/minimization redacts derived memory consistently with source records.
- [ ] Subprocessor and AI inference settings documentation covers memory prompts.

## Product QA

- [ ] Staff can see why memory context was used through source references or audit details.
- [ ] Staff workflow continues when memory is unavailable.
- [ ] EN, ET, and RU examples are covered by eval fixtures.
- [ ] Browser smoke test confirms memory-assisted AI does not change request status or urgency without staff action.
