# AI Memory Context Contract

Last updated: 2026-05-12.

## Scope

AI Memory V1 provides reviewed request, pet, and owner context for staff-facing AI assistance. It extracts operational facts from existing PetCura records into staff-reviewable candidates, then retrieves accepted memory so summaries, reply drafts, and follow-up suggestions can stay consistent.

AI memory is not a medical record, not a PMS replacement, and not an autonomous hidden profile. The PMS remains the medical system of record, and staff decide which memory becomes trusted context.

Implementation status: shipped to `main` and production deployed. V1 scope remains request, pet, and owner memory only.

## Sources

Allowed V1 sources:

- `messages`
- `attachments` metadata only
- `internal_notes`
- `request_events`
- `reminders`
- `pms_exports`
- owner and pet records linked to the request
- accepted prior `ai_outputs` for the same request

Rejected, failed, or unreviewed AI outputs may be cited for audit, but they must not become trusted memory facts.

Current structured source refs are limited to `request`, `message`, `internal_note`, and `ai_output`; attachment, reminder, PMS export, owner, and pet data can be included only through the active request context until their source-ref types are added.

## Output Kinds

### `memory_extraction`

Extracts stable, source-grounded facts from one request. Output facts must include:

- `scopeType`
- `scopeId`
- `memoryType`
- `text`
- `confidence`
- `sources[]` with `sourceType` and `sourceId`
- `sourceLocale` when known
- `expiresAt` when the fact is time-bound

Allowed memory types:

- `request_context`
- `pet_context`
- `owner_preference`
- `communication_preference`
- `follow_up_context`
- `safety_context`
- `operational_note`

### `context_retrieval`

Selects relevant memory facts for one AI task. Output context must include:

- `taskKind`
- `selectedMemoryIds`
- `contextItems`
- `rationale`
- `promptContextHash`

Context retrieval must cite source rows instead of returning unsupported background knowledge.

### `reply_draft`

Drafts are generated on demand by staff action. Draft generation retrieves accepted memory first, writes `context_retrieval`, then writes `ai_outputs.kind = reply_draft`.

`reply_draft.input_json` must include:

- `prompt_version`
- `source_locale`
- `target_locale`
- `context_retrieval_ai_output_id`
- `memory_ids`

Draft output includes text, confidence, used memory IDs, and safety notes. The draft only prefills the composer.

## Boundaries

- Memory is scoped by `clinic_id`, `scope_type`, and `scope_id`.
- No cross-clinic retrieval is allowed.
- V1 retrieval is SQL-first and limited to accepted, non-expired memory for the active request plus its linked pet and owner.
- Memory may suggest context, questions, summaries, and draft wording.
- Translation prompts intentionally do not use memory so source wording stays faithful.
- Memory must not diagnose, prescribe, set final urgency, or auto-send medical advice.
- Owner-facing content that uses memory still requires staff approval unless it is non-medical intake collection or translation.
- Prior memory context must be labeled as prior context, not current symptoms.

## Retention and Erasure

Memory inherits the retention and erasure behavior of its source records. If source PII is erased or minimized, derived memory facts and retrieval outputs must be erased, redacted, or minimized consistently while preserving required audit structure.

## Failure Mode

If extraction or retrieval fails validation, PetCura must skip memory-assisted context, continue the staff workflow, and write an `ai_outputs` failure record when an AI call occurred.
