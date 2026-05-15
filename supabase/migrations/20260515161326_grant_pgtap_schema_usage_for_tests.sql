-- The linked Supabase test runner uses a temporary login role and then
-- switches into anon/authenticated inside pgTAP scripts. Those roles need
-- schema usage to resolve pgTAP functions installed in `extensions`.
--
-- `extensions` is not an exposed API schema for PetCura, so this does not make
-- pgTAP callable through PostgREST.
grant usage on schema extensions to public;
