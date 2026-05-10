# Request Lifecycle Contract

## Statuses

- `new`
- `waiting_staff`
- `waiting_owner`
- `resolved`

## Urgency

- `low`
- `medium`
- `high`

Final urgency is staff-confirmed. AI may provide `urgency_suggestion` and `risk_flags_json` only.

## Event Types

- `created`
- `assigned`
- `status_changed`
- `urgency_changed`
- `message_sent`
- `message_received`
- `ai_action`
- `internal_note_added`
- `reminder_created`
- `export_created`
- `resolved`
- `reopened`

## Rules

- Every state change writes a `request_events` row.
- Resolved requests can be reopened.
- Status changes should preserve actor, timestamp, previous value, new value, and reason when available.
