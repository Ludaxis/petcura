begin;

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'staff-a@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'staff-b@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.clinics (id, name, slug)
values
  ('20000000-0000-4000-8000-000000000001', 'Clinic A', 'rls-clinic-a'),
  ('20000000-0000-4000-8000-000000000002', 'Clinic B', 'rls-clinic-b');

insert into public.clinic_staff (clinic_id, user_id, role)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'admin'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'admin'
  );

insert into public.owners (id, clinic_id, phone, name)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '+372000001',
    'Owner A'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '+372000002',
    'Owner B'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if (select count(*) from public.owners) <> 1 then
    raise exception 'staff A should see exactly one owner';
  end if;

  if exists (
    select 1
    from public.owners
    where clinic_id = '20000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'staff A can see clinic B owner';
  end if;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $$
begin
  if (select count(*) from public.owners) <> 0 then
    raise exception 'anonymous user can read owners';
  end if;
end $$;

rollback;
