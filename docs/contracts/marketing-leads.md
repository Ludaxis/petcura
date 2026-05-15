# Marketing Leads Contract

## Purpose

`marketing_leads` stores clinic-buyer demo and pilot requests from the public `/demo` route. It is not a CRM, not an owner intake table, and not a medical record.

## Data Boundary

The table accepts clinic-contact information only:

- `source`: internal lead source id such as `demo_page`, `hero`, `pricing`, `final_cta`, or `mobile_bar`.
- `locale`: one of `en`, `et`, `ru`.
- `clinic_name`: clinic or group name.
- `contact_name`: buyer or operator contact name.
- `work_email`: work email for follow-up.
- `country`: operating country.
- `pms_system`: optional PMS name.
- `monthly_request_volume`: optional coarse range, never exact owner message contents.
- `message`: optional free-text sales context from the buyer.
- `consent_given`: must be true.
- `user_agent_hash`: optional privacy-preserving hash for abuse debugging.

Do not store owner PII, pet medical details, phone numbers, clinic credentials, production exports, or tracking identifiers in this table.

## Access Model

- Anonymous and authenticated users may insert rows only when `consent_given = true`.
- Anonymous and authenticated users may not select, update, or delete rows.
- `service_role` may manage rows for internal operations.
- Public clients must use the Supabase publishable key under RLS. Secret keys are never exposed to client code.

## Validation

Server-side validation is mandatory before insert:

- `clinic_name`, `contact_name`, `work_email`, and `country` are required.
- `work_email` must be an email address.
- `message` is capped at 1000 characters.
- A hidden honeypot field named `website` blocks bot submissions without inserting.
- Analytics events must not include names, emails, phone numbers, or free-text message content.

## Failure Behavior

If Supabase insert fails, the UI must show a fallback mailto link prefilled with non-sensitive form context. The user should never lose the ability to contact PetCura about a pilot.
