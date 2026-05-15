# Trust Center Contract

## Purpose

`/trust` is the public trust center for clinic buyers. It explains PetCura's security, privacy, AI safety, and compliance posture using approved pilot-stage claims only.

The public legal/trust surface now includes:

- `/trust`: buyer-facing trust summary and links to public data-protection documents.
- `/privacy`: public privacy notice for website visitors, clinic buyers/staff, and owners whose clinics use PetCura.
- `/cookies`: public cookie and analytics notice.
- `/subprocessors`: public subprocessor register and buyer diligence summary.

## Approved Claims

The trust center may claim:

- Primary application data is intended to be hosted in EU regions.
- PetCura acts as processor; the clinic remains controller.
- PMS remains the medical system of record.
- PetCura stores audit trails for requests, staff actions, AI outputs, and delivery lifecycle.
- PetCura does not sell owner data or use owner conversations for advertising.
- AI assists staff with intake, categorization, risk flags, summaries, translation, and reply drafts.
- Owner-facing medical replies require staff approval.
- SOC 2 is in progress.
- ISO 27001 is planned.
- EU AI Act readiness is being tracked.

## Conditional Claims

Only claim "we do not train models on clinic data" when the vendor contracts and inference settings support that claim for the deployed provider route. If this is not contractually true for a route, use narrower wording from the provider terms.

Only publish final cookie inventory, retention periods, transfer mechanisms, and provider-specific AI retention/training claims after legal/product confirm the production configuration.

## Prohibited Claims

Do not claim:

- Completed SOC 2.
- Completed ISO 27001.
- EU AI Act conformity or certification.
- Diagnosis, prescription, final urgency setting, or autonomous medical replies.
- Named customer proof or logos without written consent.
- Quantified production outcomes without verified consented data.

## Source Of Truth

Approved marketing claim copy is centralized in `apps/web/app/(marketing)/_data/landing.ts`. Public legal-page draft copy lives in `apps/web/app/(marketing)/_data/legal.tsx` and the legal-review source document `docs/compliance/public-legal-copy.md`.
