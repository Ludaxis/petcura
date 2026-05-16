# Reports Contract

Last updated: 2026-05-16.

## Goal

Turn `/reports` into a clinic intelligence dashboard for staff. Reports summarize
communication, retention, care follow-up, AI accountability, delivery reliability,
and PMS invoice summaries without replacing the clinic PMS.

## Scope

Reports are internal staff tools. They may show operational owner and pet signals,
but they must not diagnose, prescribe, set final urgency, or infer medical status.
Financial reporting is based only on imported PMS invoice summaries; PetCura does
not process payments in v1.

## Date Ranges

- Default range: last 30 days in the clinic timezone.
- Supported preset ranges: 7, 30, and 90 days.
- Comparison range: the immediately preceding range of the same length.
- Day buckets should be labeled in the clinic timezone.
- Voided invoice summaries are excluded from totals.

## Source Tables

- Owners and retention: `owners`, `requests`, `owner_user_memberships`.
- Request operations: `requests`, `messages`, `request_events`.
- Reminder funnel: `reminders`, `message_delivery_events`, `outbound_messages`.
- Pet health follow-up signals: `pets`, `vaccinations`,
  `pet_weight_entries`, `requests`.
- AI accountability: `ai_outputs`, `ai_memory_items`, `request_events`.
- Delivery reliability: `outbound_messages`, `message_delivery_attempts`,
  `message_delivery_events`.
- Owner value: `pms_invoice_summaries`.

## Metrics

- `activeOwners`: unique owners with at least one request in range.
- `newOwners`: owners created in range.
- `repeatOwnerRate`: active owners with at least two lifetime requests divided by
  active owners.
- `reactivatedOwners`: owners active in range, inactive in comparison, and with
  at least one earlier request.
- `atRiskOwners`: owners with prior activity before the current range and no
  request in the current range.
- `firstResponseMedianMinutes`: median time from first owner message in a request
  to the first staff message after it.
- `resolutionMedianMinutes`: median time from request creation to `resolved_at`.
- `reopenRate`: reopened events divided by resolved requests in range.
- `reminderAcknowledgementRate`: acknowledged reminders divided by sent reminders.
- `deliveryFailureRate`: failed outbound messages divided by all outbound
  messages in range.
- `vaccineOverdue`: vaccinations with `next_due_at` before today.
- `vaccineDueSoon`: vaccinations with `next_due_at` from today through 30 days.
- `weightWatchCount`: pets whose latest weight differs by at least 10 percent
  from the prior recorded weight.
- `aiDraftEditRate`: accepted-with-edits or edited reply drafts divided by all
  reviewed reply drafts.
- `aiP95LatencyMs`: p95 of `ai_outputs.latency_ms` in range.
- `ownerSpendCents`: sum of non-voided `pms_invoice_summaries.gross_amount_cents`.

## PMS Invoice Summary Table

`pms_invoice_summaries` stores minimal PMS revenue facts for reporting only:

- `clinic_id`
- `owner_id`
- optional `pet_id`
- `source_system`
- `external_invoice_id_hash`
- `issued_at`
- `currency`
- `gross_amount_cents`
- optional `service_category`
- optional `metadata_json`
- `voided_at`
- `created_at`
- `updated_at`

The external invoice identifier must be hashed before storage. Do not store full
invoice PDFs, line-item medical details, payment methods, card data, or PMS
credentials in this table.

## Access

- `reports:view`: can open the Reports tab and see non-financial reporting.
- `reports:financial`: can see PMS invoice summary reporting.
- Financial rows are restricted in RLS to active `owner` and `admin` staff for
  the clinic.
- Owner portal users do not read invoice summaries in v1.

## Privacy and Compliance

- Reports must aggregate by default and avoid exposing unnecessary owner PII.
- CSV export should include only visible fields from the active report section.
- GDPR erasure/export work must treat invoice summaries as PMS-derived personal
  data linked to owners and pets.
- AI report copy must say "signals" or "review", never diagnosis or medical
  conclusion.

## Out of Scope

- Payment processing.
- Live PMS sync UI.
- Diagnosis, prescription, automated urgency assignment, or clinical scoring.
- Cross-clinic benchmarking.
- Public API access to reports.
