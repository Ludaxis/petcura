# Security Policy

PetCura handles clinic operations data, owner contact data, pet records, messages, reminders, and AI accountability logs. Treat security and privacy issues as high priority.

## Reporting

Report suspected vulnerabilities privately to the repository owner. Do not open public issues for secrets, authentication flaws, RLS bypasses, webhook signature failures, exposed PII, or infrastructure credentials.

## Sensitive Data

Never commit:

- `.env` or `.env.*` files
- service-role keys
- Supabase JWT secrets
- Twilio/Auth provider credentials
- real owner PII
- real clinic exports
- production database dumps

## Minimum Review

Security-sensitive changes require Codex review before merge. This includes:

- Supabase migrations and RLS policies
- auth/session changes
- webhook handlers
- file uploads/storage
- AI input/output logging
- GDPR export/erasure flows
- secrets and deployment configuration
