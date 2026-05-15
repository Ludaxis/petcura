-- pgTAP is required by `supabase test db --linked` for RLS gate checks.
-- Keep the extension in Supabase's non-exposed `extensions` schema.
create extension if not exists pgtap with schema extensions;
