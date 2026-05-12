# AI Memory V1 QA Checklist

Last updated: 2026-05-12.

Status: implemented, merged to `main`, and production deployed through Vercel deployment `dpl_KARXBvwFHVnD8wbSjTq6YGTfQbWK`.

## Contract

- [x] `memory_extraction` writes an `ai_outputs` row with model, prompt version, input, output, confidence, token usage, and latency.
- [x] `context_retrieval` writes an `ai_outputs` row with selected source references and `promptContextHash`.
- [x] Invalid structured output falls back to non-memory-assisted staff workflow.
- [x] Rejected or failed AI outputs are not reused as trusted memory facts.
- [x] `reply_draft` writes source locale, target locale, context retrieval output ID, and memory IDs in `ai_outputs.input_json`.

## Tenant Isolation

- [x] Memory extraction only reads rows for the active `clinic_id`.
- [x] Context retrieval cannot return facts from another clinic.
- [x] Anonymous users cannot read memory outputs or source rows.
- [x] RLS/security tests and manual Supabase checks cover memory reads and write/review denial paths.

## Safety

- [x] Extracted facts are source-grounded and cite row IDs.
- [x] Memory never sets final urgency.
- [x] Memory never generates diagnosis, prescription, or treatment instructions.
- [x] Owner-facing medical drafts that use memory require staff approval before send.
- [x] Time-bound facts include `expires_at` or are omitted from memory.

## Compliance

- [x] AI provider payloads include the minimum necessary source excerpts.
- [ ] Owner data export includes `memory_extraction` and `context_retrieval` outputs when they contain owner or pet data.
- [ ] Erasure/minimization redacts derived memory consistently with source records.
- [ ] Subprocessor and AI inference settings documentation covers memory prompts.

## Product QA

- [x] Staff can see why memory context was used through source references or audit details.
- [x] Staff workflow continues when memory is unavailable.
- [x] EN, ET, and RU examples are covered by eval fixtures.
- [x] Browser smoke test confirms memory-assisted AI does not change request status or urgency without staff action.
- [x] Manual QA covered candidate edit/approve, accepted context display, expired-memory exclusion, on-demand draft generation, and no auto-send.
- [x] Final QA polish fixed generated draft locale labels so cards no longer render `?? -> EN`.

## Verification Evidence

- `npm run test -w @petcura/web`
- `npm run typecheck -w @petcura/web`
- `npm run lint -w @petcura/web`
- `npm run build -w @petcura/web`
- `npm run test:ai`
- Production deployment state: `READY`

## Pilot Hardening Follow-Ups

- Add owner data export coverage for AI memory and AI retrieval outputs.
- Add erasure/minimization workflow coverage for derived memory rows.
- Finalize public subprocessor and AI inference settings documentation before pilot go-live.
