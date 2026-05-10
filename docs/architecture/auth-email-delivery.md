# Auth Email Delivery

PetCura uses Supabase Auth magic links for staff login. Hosted Supabase's
built-in email sender is only for demos and has strict, changeable limits. It
can block clinic staff login with errors such as `over_email_send_rate_limit`
or `email_address_not_authorized`.

## Production Decision

Use custom SMTP for Supabase Auth before inviting clinic staff outside the
founding team.

Recommended provider: Resend SMTP.

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: Resend API key
- Sender email: `no-reply@auth.petcura.app`
- Sender name: `PetCura`

Use a dedicated auth sending domain such as `auth.petcura.app`, separate from
marketing email.

## Manual Setup

1. Verify the sending domain in Resend.
2. Add SPF, DKIM, and DMARC records in Cloudflare.
3. In Supabase Dashboard, open Authentication > Emails > SMTP Settings.
4. Enable custom SMTP and enter the Resend SMTP credentials.
5. Add production redirect URLs for `https://app.petcura.app/auth/callback`.
6. Send a test magic link to `reza@ludaxis.io`.
7. Check Supabase Auth logs and Resend delivery logs.

## Management API Setup

Supabase also supports updating Auth config through the Management API. This
requires a Supabase access token from the account dashboard and the project ref.

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "mailer_secure_email_change_enabled": true,
    "mailer_autoconfirm": false,
    "smtp_admin_email": "no-reply@auth.petcura.app",
    "smtp_host": "smtp.resend.com",
    "smtp_port": 465,
    "smtp_user": "resend",
    "smtp_pass": "'"$RESEND_API_KEY"'",
    "smtp_sender_name": "PetCura"
  }'
```

## App Behavior

The login UI maps known Supabase Auth failures to clear staff-facing copy:

- `over_email_send_rate_limit` or HTTP `429` -> ask staff to wait and retry.
- `email_address_not_authorized` -> explain that custom SMTP is required.
- Any other auth send failure -> generic retry error.

## References

- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase Auth email troubleshooting: https://supabase.com/docs/guides/troubleshooting/not-receiving-auth-emails-from-the-supabase-project-OFSNzw
- Resend Supabase SMTP: https://resend.com/docs/send-with-supabase-smtp
