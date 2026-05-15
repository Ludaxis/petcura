# Marketing Analytics Contract

## Purpose

Public marketing analytics measure route and CTA performance without collecting personal information.

## Events

Allowed event names:

- `landing_cta_clicked`
- `owner_path_clicked`
- `demo_form_started`
- `demo_form_submitted`
- `demo_form_failed`
- `sandbox_opened`
- `trust_center_opened`

## Allowed Properties

Properties must be low-cardinality and non-identifying:

- `source`: internal CTA or route source id.
- `locale`: one of `en`, `et`, `ru`.
- `route`: public route such as `/`, `/demo`, `/sandbox`, `/trust`, `/owners`.
- `outcome`: `success`, `fallback`, `validation_error`, or `spam_blocked` when relevant.

## Prohibited Properties

Never send:

- Names.
- Email addresses.
- Phone numbers.
- Clinic names.
- Free-text messages.
- Owner or pet medical details.
- Clinic credentials.
- Raw user agent strings.
- Exact request volume when the form only asks for a coarse bucket.

## Implementation

Use the typed marketing analytics helper in the marketing app layer. Server actions may return result status; client components decide which non-PII event to emit.
