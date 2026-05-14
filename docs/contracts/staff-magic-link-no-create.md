# Staff Magic Link `shouldCreateUser: false` — Contract

> Owner: Codex. Single-line change to `apps/web/app/login/actions.ts:72`.
> Companion to merged plan §9.1.

## Problem

`signInWithOtp` defaults to `shouldCreateUser: true`. Today, any email
address sent to `/login` provisions a new `auth.users` row even if the
clinic never invited that person. This is a brute-enumeration vector and
also pollutes the auth user list.

## Change

```diff
- const { error } = await supabase.auth.signInWithOtp({
-   email,
-   options: {
-     emailRedirectTo: callbackUrl.toString()
-   }
- });
+ const { error } = await supabase.auth.signInWithOtp({
+   email,
+   options: {
+     emailRedirectTo: callbackUrl.toString(),
+     shouldCreateUser: false
+   }
+ });
```

## Frontend impact (already shipped)

Claude updated `/login` to surface `email_not_authorized` recovery copy and
the `auth.error.recoveryWaitlist` action. Once Codex applies the change,
unknown-email submissions hit that path instead of silently provisioning.

## Acceptance criteria

- Sending an unknown email returns the existing
  `email_not_authorized` redirect.
- No `auth.users` row is created on send.
- Isolation test: previously-invited staff still receive their link.

## Files

- `apps/web/app/login/actions.ts:72` — single options field.
