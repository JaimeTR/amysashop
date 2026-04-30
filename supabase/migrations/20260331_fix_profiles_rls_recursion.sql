-- Fix: infinite recursion detected in policy for relation "profiles"
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- 1) Asegurar RLS activa
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Eliminar TODAS las policies actuales en profiles (evita dejar una recursiva viva)
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', p.policyname);
  END LOOP;
END
$$;

-- 3) Policies seguras (sin subconsultas a profiles)
-- Cada usuario puede leer su propio perfil
CREATE POLICY profiles_select_self
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Cada usuario puede crear su propio perfil
CREATE POLICY profiles_insert_self
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Cada usuario puede actualizar su propio perfil
CREATE POLICY profiles_update_self
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service role tiene acceso total (para acciones backend/admin)
CREATE POLICY profiles_service_role_all
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- Verificación rápida
SELECT policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;
