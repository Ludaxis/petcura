# Appointments Contract

Availability-aware V2 for the Alex pilot.

## Goal

PetCura owns a lightweight internal clinic calendar: staff availability, time off, slot suggestions, staff-approved offers, owner confirmation, and an auditable appointment timeline. The clinic PMS remains the medical record; PetCura owns communication and scheduling workflow.

## Scope

In V2 PetCura supports:

- Owner appointment requests with preferred window and notes.
- Staff availability rules per clinic member.
- Staff time-off blocks.
- Earliest valid slot lookup over a 14-day horizon.
- Staff-sent slot offers with three options.
- 10-minute holds for offered slots.
- Staff direct confirmation when booking by phone.
- Owner confirmation from `/o/chat/[requestId]`.
- Appointment-aware AI reply drafts that can only mention trusted slots.

Out of scope: Google Calendar sync, PMS sync, drag/drop rescheduling, recurring appointments, rooms/equipment, payments/deposits, autonomous booking.

## Schema Additions

- `staff_availability_rules`: weekly working windows by `clinic_id`, `staff_id`, `weekday`, `start_time`, `end_time`, optional `service_ids`.
- `staff_time_off`: unavailable date-time ranges per staff member.
- `appointment_slot_offers`: staff-sent offer groups with `slots_json`, status, expiry, and accepted slot.
- `appointment_holds`: temporary holds backing each offered slot.
- `appointment_events`: appointment-specific timeline in addition to `request_events`.

Every table has `clinic_id`; every table has RLS. Staff writes are constrained to appointment/availability permissions. Owners may only read/confirm offers tied to their own appointment.

## Status Machine

| From → To | Trigger |
|---|---|
| `requested → confirmed` | Staff confirms directly or owner accepts offered slot |
| `requested → rescheduled` | Staff replaces offer after owner asks for another time |
| `rescheduled → confirmed` | Owner accepts new offer |
| `requested/rescheduled/confirmed → cancelled` | Staff or owner cancels |
| `confirmed → completed` | Staff marks visit complete |
| `confirmed → no_show` | Clinic marks no-show |

Confirmed appointments require `scheduled_at`, `duration_minutes`, and `staff_id`. Database-level overlap protection blocks double-booking confirmed/rescheduled appointments for the same staff member.

## Slot Rules

- Clinic timezone is source of truth for display.
- Storage uses `timestamptz`.
- Granularity: 15 minutes.
- Default horizon: 14 days.
- Default offer count: 3 slots.
- Default hold TTL: 10 minutes.
- Slot is valid only when it fits an active availability rule, staff is eligible for the service, no time-off overlaps, no confirmed appointment overlaps, and no active hold overlaps.

## Staff UX Contract

`/calendar` shows:

- Desktop: responsive multi-day agenda with staff lanes.
- Mobile: date chips + agenda cards.
- Filters: date range, staff member, status.
- Next free slots panel.

Request detail shows an appointment panel when `request.category='appointment'`:

- Owner/pet/service context.
- Preferred owner window.
- Earliest three valid slots.
- Actions: offer slots, confirm first slot, generate appointment-aware draft.

Settings → Availability shows:

- Working-day/hour rules per staff member.
- Service eligibility chips.
- Time-off blocks.
- Clinic timezone.

## Owner UX Contract

Owner service request:

- Owner chooses pet, preferred date/time, and notes.
- If availability exists, show earliest likely options as guidance only. They are not booked.

Owner chat:

- Staff-offered slots render as a confirmation card.
- Owner can confirm one slot or ask for another time.
- WhatsApp replies `1`, `2`, `3` or localized equivalents may confirm only an active staff-sent offer. Free text never auto-books.

## AI Contract

`reply_draft.v2` receives:

- Current request messages.
- Owner, pet, service, and appointment fields.
- Active slot offers and current valid slot suggestions.
- Accepted memory context.

AI must:

- Mention only slots in the provided availability snapshot or active offer.
- Never invent availability.
- Never say “booked” unless appointment status is already `confirmed`.
- Ask staff to check availability if no trusted slot exists.
- Persist sources in `ai_outputs` / `ai_output_sources`.

## Tests

- Slot generation: timezone display, duration alignment, lead time, no overlaps.
- RLS: clinic isolation, owner isolation, viewer cannot mutate, direct table writes do not bypass staff role checks.
- Playwright: owner request → staff offer → owner confirm → calendar updates.
- AI eval: appointment draft uses offered slots and prior conversation without invented bookings.
