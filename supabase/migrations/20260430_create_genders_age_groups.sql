-- Crea tablas maestras para géneros y grupos de edad
-- Idempotente — ejecutar desde Supabase SQL Editor o con migraciones

BEGIN;

-- Asegurar extensión para UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.genders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS y permisos similares a otras tablas maestras
ALTER TABLE public.genders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.genders, public.age_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.genders, public.age_groups TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'genders' AND policyname = 'genders_select_all'
  ) THEN
    CREATE POLICY genders_select_all ON public.genders FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'genders' AND policyname = 'genders_write_authenticated'
  ) THEN
    CREATE POLICY genders_write_authenticated ON public.genders FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'age_groups' AND policyname = 'age_groups_select_all'
  ) THEN
    CREATE POLICY age_groups_select_all ON public.age_groups FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'age_groups' AND policyname = 'age_groups_write_authenticated'
  ) THEN
    CREATE POLICY age_groups_write_authenticated ON public.age_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMIT;
