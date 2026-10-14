-- Row-level security on every table in "public".
--
-- Supabase serves the public schema through its Data API (PostgREST) to the
-- `anon` and `authenticated` roles, and the anon key ships in every Supabase
-- project's client config. Without RLS, that key reads and writes these
-- tables directly, OtpCode and User included, bypassing this backend.
--
-- No policies on purpose: this app never talks to the Data API. The backend
-- connects as the role that owns these tables, and RLS does not restrict a
-- table's owner (nothing here uses FORCE ROW LEVEL SECURITY), so the app is
-- unaffected while anon and authenticated see zero rows.
--
-- Covers every table that exists when it runs, _prisma_migrations included.
-- Tables added later enable RLS in their own migration; a unit test enforces
-- it (src/prisma/migrations-rls.spec.ts).
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
