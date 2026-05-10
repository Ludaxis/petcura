-- RLS smoke test notes for Supabase SQL test runner.
-- These checks become executable once project-specific auth fixtures exist.

-- Expected:
-- 1. Staff with active_clinic_id=A can read clinic A rows.
-- 2. Staff with active_clinic_id=A cannot read clinic B rows.
-- 3. Anonymous users cannot read domain tables.
-- 4. Service-role jobs are audited when they bypass RLS.
