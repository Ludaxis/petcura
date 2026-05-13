begin;

insert into auth.users (
  id,
  aud,
  role,
  phone,
  phone_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '61000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    '+37255500001',
    now(),
    '{"petcura_actor":"owner"}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    '+37255500002',
    now(),
    '{"petcura_actor":"owner"}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.clinics (id, name, slug)
values
  ('62000000-0000-4000-8000-000000000001', 'Owner Clinic A', 'owner-rls-a'),
  ('62000000-0000-4000-8000-000000000002', 'Owner Clinic B', 'owner-rls-b');

insert into public.owners (id, clinic_id, phone, name)
values
  (
    '63000000-0000-4000-8000-000000000001',
    '62000000-0000-4000-8000-000000000001',
    '+37255500001',
    'Owner A'
  ),
  (
    '63000000-0000-4000-8000-000000000002',
    '62000000-0000-4000-8000-000000000002',
    '+37255500002',
    'Owner B'
  );

insert into public.owner_users (user_id)
values
  ('61000000-0000-4000-8000-000000000001'),
  ('61000000-0000-4000-8000-000000000002');

insert into public.owner_user_identities (
  user_id,
  identity_type,
  identity_value
)
values
  (
    '61000000-0000-4000-8000-000000000001',
    'phone',
    '+37255500001'
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    'phone',
    '+37255500002'
  );

insert into public.owner_user_memberships (user_id, clinic_id, owner_id)
values
  (
    '61000000-0000-4000-8000-000000000001',
    '62000000-0000-4000-8000-000000000001',
    '63000000-0000-4000-8000-000000000001'
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    '62000000-0000-4000-8000-000000000002',
    '63000000-0000-4000-8000-000000000002'
  );

insert into public.pets (id, clinic_id, owner_id, name, species)
values
  (
    '64000000-0000-4000-8000-000000000001',
    '62000000-0000-4000-8000-000000000001',
    '63000000-0000-4000-8000-000000000001',
    'Luna',
    'cat'
  ),
  (
    '64000000-0000-4000-8000-000000000002',
    '62000000-0000-4000-8000-000000000002',
    '63000000-0000-4000-8000-000000000002',
    'Bruno',
    'dog'
  );

insert into public.services (
  id,
  clinic_id,
  slug,
  category,
  name_i18n,
  duration_minutes
)
values
  (
    '65000000-0000-4000-8000-000000000001',
    '62000000-0000-4000-8000-000000000001',
    'checkup-a',
    'checkup',
    '{"en":"Checkup A"}'::jsonb,
    30
  ),
  (
    '65000000-0000-4000-8000-000000000002',
    '62000000-0000-4000-8000-000000000002',
    'checkup-b',
    'checkup',
    '{"en":"Checkup B"}'::jsonb,
    30
  );

insert into public.vaccinations (
  clinic_id,
  pet_id,
  vaccine_code,
  vaccine_name,
  administered_at
)
values
  (
    '62000000-0000-4000-8000-000000000001',
    '64000000-0000-4000-8000-000000000001',
    'rabies',
    'Rabies',
    current_date
  ),
  (
    '62000000-0000-4000-8000-000000000002',
    '64000000-0000-4000-8000-000000000002',
    'dhpp',
    'DHPP',
    current_date
  );

insert into public.requests (
  id,
  clinic_id,
  owner_id,
  pet_id,
  category,
  status,
  urgency,
  channel
)
values
  (
    '66000000-0000-4000-8000-000000000001',
    '62000000-0000-4000-8000-000000000001',
    '63000000-0000-4000-8000-000000000001',
    '64000000-0000-4000-8000-000000000001',
    'medical_question',
    'new',
    'low',
    'web'
  ),
  (
    '66000000-0000-4000-8000-000000000002',
    '62000000-0000-4000-8000-000000000002',
    '63000000-0000-4000-8000-000000000002',
    '64000000-0000-4000-8000-000000000002',
    'medical_question',
    'new',
    'low',
    'web'
  );

insert into public.messages (
  request_id,
  clinic_id,
  sender_type,
  sender_id,
  body
)
values
  (
    '66000000-0000-4000-8000-000000000001',
    '62000000-0000-4000-8000-000000000001',
    'owner',
    '63000000-0000-4000-8000-000000000001',
    'Visible owner message'
  ),
  (
    '66000000-0000-4000-8000-000000000002',
    '62000000-0000-4000-8000-000000000002',
    'owner',
    '63000000-0000-4000-8000-000000000002',
    'Hidden owner message'
  );

insert into public.ai_outputs (
  clinic_id,
  request_id,
  kind,
  model,
  prompt_version,
  input_json,
  output_json
)
values (
  '62000000-0000-4000-8000-000000000001',
  '66000000-0000-4000-8000-000000000001',
  'reply_draft',
  'test',
  'v1',
  '{}'::jsonb,
  '{}'::jsonb
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '61000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"61000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"petcura_actor":"owner"}}',
  true
);

do $$
begin
  if (select count(*) from public.clinics) <> 1 then
    raise exception 'owner A should see one clinic';
  end if;

  if (select count(*) from public.owners) <> 1 then
    raise exception 'owner A should see one owner profile';
  end if;

  if (select count(*) from public.pets) <> 1 then
    raise exception 'owner A should see one pet';
  end if;

  if (select count(*) from public.services) <> 1 then
    raise exception 'owner A should see one active service';
  end if;

  if (select count(*) from public.vaccinations) <> 1 then
    raise exception 'owner A should see one vaccination';
  end if;

  if (select count(*) from public.requests) <> 1 then
    raise exception 'owner A should see one request';
  end if;

  if (select count(*) from public.messages) <> 1 then
    raise exception 'owner A should see one message';
  end if;

  if (select count(*) from public.ai_outputs) <> 0 then
    raise exception 'owner A must not read AI outputs';
  end if;

  if public.is_active_clinic_member(
    '62000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'owner-context JWT must not pass staff membership checks';
  end if;
end $$;

rollback;
