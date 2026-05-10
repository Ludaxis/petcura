# PR Review Checklist

## Product

- The change matches the task brief.
- V1 non-goals were not added accidentally.
- Clinic and owner workflows remain clear.

## Architecture

- Ownership boundaries were respected.
- Shared contracts are documented.
- No unnecessary dependency or abstraction was introduced.

## Data and Security

- Tenant-owned data includes `clinic_id`.
- RLS/security changes have tests.
- Webhook or background-job changes are idempotent.
- No secrets, credentials, or real PII are committed.

## AI Safety

- AI output is advisory unless reviewed.
- Prompt versions and evals are updated when needed.
- No diagnosis, prescription, or autonomous medical advice was introduced.

## Frontend

- UI follows PetCura design direction.
- Mobile and desktop behavior are checked.
- Keyboard, focus, contrast, and labels are acceptable.
- EN/ET/RU text expansion is considered.

## Verification

- Relevant commands were run.
- Failures are explained.
- Risk and rollback notes are included.
