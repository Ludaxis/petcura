begin;

set local search_path = public, extensions;

select plan(4);

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
    '71000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'reports-admin-a@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'reports-admin-b@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '71000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'reports-viewer-a@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.clinics (id, name, slug)
values
  ('72000000-0000-4000-8000-000000000001', 'Reports Clinic A', 'reports-rls-a'),
  ('72000000-0000-4000-8000-000000000002', 'Reports Clinic B', 'reports-rls-b');

insert into public.clinic_staff (clinic_id, user_id, role)
values
  (
    '72000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001',
    'admin'
  ),
  (
    '72000000-0000-4000-8000-000000000002',
    '71000000-0000-4000-8000-000000000002',
    'owner'
  ),
  (
    '72000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000003',
    'viewer'
  );

insert into public.owners (id, clinic_id, phone, name)
values
  (
    '73000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    '+37277700001',
    'Reports Owner A'
  ),
  (
    '73000000-0000-4000-8000-000000000002',
    '72000000-0000-4000-8000-000000000002',
    '+37277700002',
    'Reports Owner B'
  );

insert into public.pets (id, clinic_id, owner_id, name, species)
values
  (
    '74000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    '73000000-0000-4000-8000-000000000001',
    'Lumi',
    'cat'
  ),
  (
    '74000000-0000-4000-8000-000000000002',
    '72000000-0000-4000-8000-000000000002',
    '73000000-0000-4000-8000-000000000002',
    'Bruno',
    'dog'
  );

insert into public.pms_invoice_summaries (
  clinic_id,
  owner_id,
  pet_id,
  source_system,
  external_invoice_id_hash,
  issued_at,
  currency,
  gross_amount_cents,
  service_category
)
values
  (
    '72000000-0000-4000-8000-000000000001',
    '73000000-0000-4000-8000-000000000001',
    '74000000-0000-4000-8000-000000000001',
    'demo-pms',
    'hash-a-1',
    now(),
    'EUR',
    12900,
    'consultation'
  ),
  (
    '72000000-0000-4000-8000-000000000002',
    '73000000-0000-4000-8000-000000000002',
    '74000000-0000-4000-8000-000000000002',
    'demo-pms',
    'hash-b-1',
    now(),
    'EUR',
    8800,
    'vaccination'
  );

set local role authenticated;
do $jwt$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '71000000-0000-4000-8000-000000000001',
    true
  );
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end
$jwt$;

select lives_ok(
  $test$
  do $block$
begin
  if (select count(*) from public.pms_invoice_summaries) <> 1 then
    raise exception 'clinic A admin should see exactly one invoice summary';
  end if;

  if exists (
    select 1
    from public.pms_invoice_summaries
    where clinic_id = '72000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'clinic A admin can see clinic B invoice summary';
  end if;
end
$block$;
  $test$,
  'admin reads only own clinic invoice summaries'
);

reset role;
set local role authenticated;
do $jwt$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '71000000-0000-4000-8000-000000000003',
    true
  );
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end
$jwt$;

select lives_ok(
  $test$
  do $block$
begin
  if (select count(*) from public.pms_invoice_summaries) <> 0 then
    raise exception 'viewer should not read financial summaries';
  end if;
end
$block$;
  $test$,
  'viewer cannot read financial summaries'
);

select throws_ok(
  $test$
  insert into public.pms_invoice_summaries (
    clinic_id,
    owner_id,
    source_system,
    external_invoice_id_hash,
    issued_at,
    gross_amount_cents
  )
  values (
    '72000000-0000-4000-8000-000000000001',
    '73000000-0000-4000-8000-000000000001',
    'demo-pms',
    'hash-viewer-write',
    now(),
    1200
  )
  $test$,
  '42501',
  'new row violates row-level security policy for table "pms_invoice_summaries"',
  'viewer cannot insert financial summaries'
);

reset role;
set local role anon;
do $jwt$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
end
$jwt$;

select throws_ok(
  $test$ select 1 from public.pms_invoice_summaries limit 1 $test$,
  '42501',
  'permission denied for table pms_invoice_summaries',
  'anonymous cannot read financial summaries'
);

reset role;
select * from finish();

rollback;
