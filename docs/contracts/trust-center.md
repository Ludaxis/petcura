# Trust Center Contract

## Purpose

`/trust` is the public trust center for clinic buyers. It explains PetCura's security, privacy, AI safety, and compliance posture using approved pilot-stage claims only.

## Approved Claims

The trust center may claim:

- Primary application data is intended to be hosted in EU regions.
- PetCura acts as processor; the clinic remains controller.
- PMS remains the medical system of record.
- PetCura stores audit trails for requests, staff actions, AI outputs, and delivery lifecycle.
- AI assists staff with intake, categorization, risk flags, summaries, translation, and reply drafts.
- Owner-facing medical replies require staff approval.
- SOC 2 is in progress.
- ISO 27001 is planned.
- EU AI Act readiness is being tracked.

## Conditional Claims

Only claim "we do not train models on clinic data" when the vendor contracts and inference settings support that claim for the deployed provider route. If this is not contractually true for a route, use narrower wording from the provider terms.

## Prohibited Claims

Do not claim:

- Completed SOC 2.
- Completed ISO 27001.
- EU AI Act conformity or certification.
- Diagnosis, prescription, final urgency setting, or autonomous medical replies.
- Named customer proof or logos without written consent.
- Quantified production outcomes without verified consented data.

## Source Of Truth

Allowed claim copy is centralized in `apps/web/app/(marketing)/_data/landing.ts` so landing, trust center, and tests do not drift.
