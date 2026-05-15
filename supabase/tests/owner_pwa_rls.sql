begin;

set local search_path = public, extensions;

select plan(16);

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
  id,
  clinic_id,
  request_id,
  kind,
  model,
  prompt_version,
  input_json,
  output_json
)
values (
  '67000000-0000-4000-8000-000000000001',
  '62000000-0000-4000-8000-000000000001',
  '66000000-0000-4000-8000-000000000001',
  'reply_draft',
  'test',
  'v1',
  '{}'::jsonb,
  '{}'::jsonb
);

insert into public.ai_output_sources (
  clinic_id,
  ai_output_id,
  source_type,
  source_id
)
values (
  '62000000-0000-4000-8000-000000000001',
  '67000000-0000-4000-8000-000000000001',
  'request',
  '66000000-0000-4000-8000-000000000001'
);

set local role authenticated;
do $jwt$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '61000000-0000-4000-8000-000000000001',
    true
  );
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    '{"sub":"61000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"petcura_actor":"owner"}}',
    true
  );
end
$jwt$;

select is((select count(*)::integer from public.clinics), 1, 'owner A sees one clinic');
select is((select count(*)::integer from public.owners), 1, 'owner A sees one owner profile');
select is((select count(*)::integer from public.pets), 1, 'owner A sees one pet');
select is((select count(*)::integer from public.services), 1, 'owner A sees one active service');
select is((select count(*)::integer from public.vaccinations), 1, 'owner A sees one vaccination');
select is((select count(*)::integer from public.requests), 1, 'owner A sees one request');
select is((select count(*)::integer from public.messages), 1, 'owner A sees one message');
select is((select count(*)::integer from public.ai_outputs), 0, 'owner A cannot read AI outputs');
select is((select count(*)::integer from public.ai_output_sources), 0, 'owner A cannot read AI output sources');
select lives_ok(
  $test$
  update public.owners
  set
    name = 'Owner A Updated',
    email = 'owner-a@example.test',
    preferred_language = 'et',
    photo_url = '62000000-0000-4000-8000-000000000001/owners/63000000-0000-4000-8000-000000000001/avatar.webp'
  where id = '63000000-0000-4000-8000-000000000001'
  $test$,
  'owner A can update safe owner profile fields'
);
select throws_ok(
  $test$
  update public.owners
  set notes = 'owner should not edit clinic-owned notes'
  where id = '63000000-0000-4000-8000-000000000001'
  $test$,
  'P0001',
  'owner_forbidden_field_update',
  'owner A cannot update clinic-owned owner notes'
);
select lives_ok(
  $test$
  update public.pets
  set
    owner_notes = 'Prefers quiet rooms.',
    photo_url = '62000000-0000-4000-8000-000000000001/pets/64000000-0000-4000-8000-000000000001/avatar.webp'
  where id = '64000000-0000-4000-8000-000000000001'
  $test$,
  'owner A can update safe pet self-service fields'
);
select throws_ok(
  $test$
  update public.pets
  set medical_notes = 'owner should not edit medical notes'
  where id = '64000000-0000-4000-8000-000000000001'
  $test$,
  'P0001',
  'owner_forbidden_field_update',
  'owner A cannot update clinic-owned pet medical notes'
);
select throws_ok(
  $test$
  update public.pets
  set weight_kg = 7.25
  where id = '64000000-0000-4000-8000-000000000001'
  $test$,
  'P0001',
  'owner_forbidden_field_update',
  'owner A cannot directly update pet weight'
);
select lives_ok(
  $test$
  do $block$
  begin
    insert into public.pet_weight_entries (
      clinic_id,
      pet_id,
      weight_kg,
      measured_at,
      source,
      created_by
    )
    values (
      '62000000-0000-4000-8000-000000000001',
      '64000000-0000-4000-8000-000000000001',
      5.55,
      current_date,
      'owner',
      '61000000-0000-4000-8000-000000000001'
    );

    if (
      select weight_kg
      from public.pets
      where id = '64000000-0000-4000-8000-000000000001'
    ) <> 5.55 then
      raise exception 'owner weight entry did not sync pet latest weight';
    end if;
  end
  $block$
  $test$,
  'owner A can add an owner-sourced weight entry'
);
select is(
  public.is_active_clinic_member('62000000-0000-4000-8000-000000000001'),
  false,
  'owner-context JWT does not pass staff membership checks'
);

reset role;
select * from finish();

rollback;
