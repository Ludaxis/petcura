alter table public.owner_user_identities
  drop constraint if exists owner_user_identities_identity_type_check;

alter table public.owner_user_identities
  add constraint owner_user_identities_identity_type_check
  check (identity_type in ('phone', 'email', 'oauth_google', 'oauth_apple'));
