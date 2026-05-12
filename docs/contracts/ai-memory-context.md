# AI Memory Context Contract

## Scope

AI Memory V1 provides reviewed request, pet, and owner context for staff-facing AI assistance. It extracts operational facts from existing PetCura records into staff-reviewable candidates, then retrieves accepted memory so summaries, reply drafts, and follow-up suggestions can stay consistent.

AI memory is not a medical record, not a PMS replacement, and not an autonomous hidden profile. The PMS remains the medical system of record, and staff decide which memory becomes trusted context.

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

## Output Kinds

### `memory_extraction`

Extracts stable, source-grounded facts from one request. Output facts must include:

- `fact_id`
- `category`
- `text`
- `source_type`
- `source_id`
- `source_created_at`
- `confidence`
- `expires_at` when the fact is time-bound

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

- `task_kind`
- `selected_fact_ids`
- `source_refs`
- `rationale`
- `omitted_fact_ids` when potentially relevant facts were excluded
- `prompt_context_hash`

Context retrieval must cite source rows instead of returning unsupported background knowledge.

## Boundaries

- Memory is scoped by `clinic_id`, `scope_type`, and `scope_id`.
- No cross-clinic retrieval is allowed.
- V1 retrieval is SQL-first and limited to accepted, non-expired memory for the active request plus its linked pet and owner.
- Memory may suggest context, questions, summaries, and draft wording.
- Translation prompts intentionally do not use memory so source wording stays faithful.
- Memory must not diagnose, prescribe, set final urgency, or auto-send medical advice.
- Owner-facing content that uses memory still requires staff approval unless it is non-medical intake collection or translation.

## Retention and Erasure

Memory inherits the retention and erasure behavior of its source records. If source PII is erased or minimized, derived memory facts and retrieval outputs must be erased, redacted, or minimized consistently while preserving required audit structure.

## Failure Mode

If extraction or retrieval fails validation, PetCura must skip memory-assisted context, continue the staff workflow, and write an `ai_outputs` failure record when an AI call occurred.
