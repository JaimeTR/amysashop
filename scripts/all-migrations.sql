-- =========================================
-- MIGRACION: 20260330_add_product_columns.sql
-- =========================================
-- Agregar columnas faltantes a productos para soporte de marca/submarca/subcategorÃ­a nativos
-- Esta migraciÃ³n se ejecuta antes de 20260331_taxonomy_management.sql

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS sub_brand TEXT,
ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- Crear Ã­ndices para bÃºsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sub_brand ON public.products(sub_brand);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON public.products(sub_category);

-- =========================================
-- MIGRACION: 20260331_fix_profiles_rls_recursion.sql
-- =========================================
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

-- VerificaciÃ³n rÃ¡pida
SELECT policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- =========================================
-- MIGRACION: 20260331_full_taxonomy_setup.sql
-- =========================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- Setup completo de taxonomÃ­as para AMYSA (idempotente)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- Ejecutar en Supabase SQL Editor

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    BEGIN;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- 0) ExtensiÃ³n para UUID (normalmente ya existe en Supabase)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE EXTENSION IF NOT EXISTS pgcrypto;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- 1) Columnas nuevas en products
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ALTER TABLE public.products
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ADD COLUMN IF NOT EXISTS brand TEXT,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ADD COLUMN IF NOT EXISTS sub_brand TEXT,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ADD COLUMN IF NOT EXISTS sub_category TEXT;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- Ãndices para filtros/bÃºsquedas
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE INDEX IF NOT EXISTS idx_products_sub_brand ON public.products(sub_brand);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE INDEX IF NOT EXISTS idx_products_sub_category ON public.products(sub_category);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- 2) Tablas maestras
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE TABLE IF NOT EXISTS public.brands (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    name TEXT NOT NULL UNIQUE,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE TABLE IF NOT EXISTS public.sub_brands (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    name TEXT NOT NULL,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    UNIQUE (brand_id, name)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE TABLE IF NOT EXISTS public.sub_categories (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    name TEXT NOT NULL,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    UNIQUE (category_id, name)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE INDEX IF NOT EXISTS idx_sub_brands_brand_id ON public.sub_brands(brand_id);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON public.sub_categories(category_id);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- 3) Backfill desde products existentes
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    INSERT INTO public.brands (name)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    SELECT DISTINCT TRIM(COALESCE(p.brand, ''))
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    FROM public.products p
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    WHERE TRIM(COALESCE(p.brand, '')) <> ''
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ON CONFLICT (name) DO NOTHING;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    INSERT INTO public.sub_brands (brand_id, name)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    SELECT DISTINCT b.id, TRIM(COALESCE(p.sub_brand, ''))
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    FROM public.products p
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    JOIN public.brands b ON b.name = TRIM(COALESCE(p.brand, ''))
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    WHERE TRIM(COALESCE(p.brand, '')) <> ''
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    AND TRIM(COALESCE(p.sub_brand, '')) <> ''
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ON CONFLICT (brand_id, name) DO NOTHING;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    INSERT INTO public.sub_categories (category_id, name)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    SELECT DISTINCT p.category_id, TRIM(COALESCE(p.sub_category, ''))
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    FROM public.products p
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    WHERE p.category_id IS NOT NULL
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    AND TRIM(COALESCE(p.sub_category, '')) <> ''
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ON CONFLICT (category_id, name) DO NOTHING;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    COMMIT;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- 4) Seguridad recomendada (RLS + permisos)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ALTER TABLE public.sub_brands ENABLE ROW LEVEL SECURITY;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    GRANT SELECT ON public.brands, public.sub_brands, public.sub_categories TO anon;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands, public.sub_brands, public.sub_categories TO authenticated;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- Policies idempotentes
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    DO $$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    BEGIN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    IF NOT EXISTS (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        SELECT 1 FROM pg_policies
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE schemaname = 'public' AND tablename = 'brands' AND policyname = 'brands_select_all'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ) THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        CREATE POLICY brands_select_all ON public.brands
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        FOR SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        USING (true);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    IF NOT EXISTS (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        SELECT 1 FROM pg_policies
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE schemaname = 'public' AND tablename = 'sub_brands' AND policyname = 'sub_brands_select_all'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ) THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        CREATE POLICY sub_brands_select_all ON public.sub_brands
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        FOR SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        USING (true);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    IF NOT EXISTS (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        SELECT 1 FROM pg_policies
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE schemaname = 'public' AND tablename = 'sub_categories' AND policyname = 'sub_categories_select_all'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ) THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        CREATE POLICY sub_categories_select_all ON public.sub_categories
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        FOR SELECT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        USING (true);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    IF NOT EXISTS (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        SELECT 1 FROM pg_policies
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE schemaname = 'public' AND tablename = 'brands' AND policyname = 'brands_write_authenticated'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ) THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        CREATE POLICY brands_write_authenticated ON public.brands
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        FOR ALL
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        TO authenticated
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        USING (true)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WITH CHECK (true);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    IF NOT EXISTS (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        SELECT 1 FROM pg_policies
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE schemaname = 'public' AND tablename = 'sub_brands' AND policyname = 'sub_brands_write_authenticated'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ) THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        CREATE POLICY sub_brands_write_authenticated ON public.sub_brands
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        FOR ALL
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        TO authenticated
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        USING (true)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WITH CHECK (true);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    IF NOT EXISTS (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        SELECT 1 FROM pg_policies
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE schemaname = 'public' AND tablename = 'sub_categories' AND policyname = 'sub_categories_write_authenticated'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ) THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        CREATE POLICY sub_categories_write_authenticated ON public.sub_categories
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        FOR ALL
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        TO authenticated
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        USING (true)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WITH CHECK (true);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    END IF;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    END
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    $$;
-- =========================================
-- MIGRACION: 20260331_orders_payment_columns.sql
-- =========================================
-- Asegura columnas necesarias para gestiÃ³n de pedidos y pagos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Estado por defecto para pedidos existentes sin payment_status
UPDATE public.orders
SET payment_status = 'pendiente'
WHERE payment_status IS NULL OR TRIM(payment_status) = '';

-- Ãndices recomendados para filtros en panel admin
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON public.orders(channel);

-- =========================================
-- MIGRACION: 20260331_products_images_storage_setup.sql
-- =========================================
-- Asegura soporte de imÃ¡genes para productos
-- Ejecutar en Supabase SQL Editor

-- 1) Columna images en products (compatible con esquemas existentes)
DO $$
DECLARE
  col_data_type TEXT;
  col_udt_name TEXT;
BEGIN
  SELECT data_type, udt_name
  INTO col_data_type, col_udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'images';

  -- Si no existe, la creamos como jsonb para mÃ¡xima compatibilidad.
  IF col_data_type IS NULL THEN
    ALTER TABLE public.products
      ADD COLUMN images jsonb NOT NULL DEFAULT '[]'::jsonb;
    RETURN;
  END IF;

  -- Si ya es text[], dejamos default/valores para text[].
  IF col_data_type = 'ARRAY' AND col_udt_name = '_text' THEN
    ALTER TABLE public.products
      ALTER COLUMN images SET DEFAULT ARRAY[]::TEXT[];

    UPDATE public.products
    SET images = ARRAY[]::TEXT[]
    WHERE images IS NULL;

    RETURN;
  END IF;

  -- Si es jsonb (tu caso actual), usamos default jsonb.
  IF col_data_type = 'jsonb' THEN
    ALTER TABLE public.products
      ALTER COLUMN images SET DEFAULT '[]'::jsonb;

    UPDATE public.products
    SET images = '[]'::jsonb
    WHERE images IS NULL;

    RETURN;
  END IF;

  -- Si es json, migramos a jsonb y normalizamos default.
  IF col_data_type = 'json' THEN
    ALTER TABLE public.products
      ALTER COLUMN images TYPE jsonb USING COALESCE(images::jsonb, '[]'::jsonb);

    ALTER TABLE public.products
      ALTER COLUMN images SET DEFAULT '[]'::jsonb;

    UPDATE public.products
    SET images = '[]'::jsonb
    WHERE images IS NULL;

    RETURN;
  END IF;

  RAISE EXCEPTION 'Tipo no soportado para public.products.images: % (%)', col_data_type, col_udt_name;
END
$$;

-- 2) Bucket pÃºblico para imÃ¡genes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- MIGRACION: 20260331_taxonomy_management.sql
-- =========================================
-- Estructura maestra para marcas/submarcas y categorÃ­as/subcategorÃ­as
-- Ejecutar una sola vez en la base de datos (Supabase SQL editor)

BEGIN;

-- 1) Tabla de marcas padre
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Tabla de submarcas (hijas de una marca)
CREATE TABLE IF NOT EXISTS public.sub_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, name)
);

-- 3) Tabla de subcategorÃ­as (hijas de una categorÃ­a)
CREATE TABLE IF NOT EXISTS public.sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, name)
);

-- Ãndices recomendados
CREATE INDEX IF NOT EXISTS idx_sub_brands_brand_id ON public.sub_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON public.sub_categories(category_id);

-- 4) Backfill inicial desde productos existentes (si tienen datos)
INSERT INTO public.brands (name)
SELECT DISTINCT TRIM(COALESCE(p.brand, ''))
FROM public.products p
WHERE TRIM(COALESCE(p.brand, '')) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.sub_brands (brand_id, name)
SELECT DISTINCT b.id, TRIM(COALESCE(p.sub_brand, ''))
FROM public.products p
JOIN public.brands b ON b.name = TRIM(COALESCE(p.brand, ''))
WHERE TRIM(COALESCE(p.brand, '')) <> ''
  AND TRIM(COALESCE(p.sub_brand, '')) <> ''
ON CONFLICT (brand_id, name) DO NOTHING;

INSERT INTO public.sub_categories (category_id, name)
SELECT DISTINCT p.category_id, TRIM(COALESCE(p.sub_category, ''))
FROM public.products p
WHERE p.category_id IS NOT NULL
  AND TRIM(COALESCE(p.sub_category, '')) <> ''
ON CONFLICT (category_id, name) DO NOTHING;

COMMIT;

-- =========================================
-- MIGRACION: 20260401_add_perfume_attributes_to_products.sql
-- =========================================
-- Extiende products con atributos de perfumeria (idempotente)
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- 1) Nuevas columnas (compatibles con esquema actual)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS nso TEXT,
  ADD COLUMN IF NOT EXISTS precio_normal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS precio_catalogo NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS precio_oferta NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS descuento_porcentaje INTEGER,
  ADD COLUMN IF NOT EXISTS resumen TEXT,
  ADD COLUMN IF NOT EXISTS contenido TEXT,
  ADD COLUMN IF NOT EXISTS regalos TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS imagen_principal TEXT,
  ADD COLUMN IF NOT EXISTS galeria_imagenes TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_pack BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 2) Restriccion de descuento (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_descuento_porcentaje_chk'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_descuento_porcentaje_chk
      CHECK (descuento_porcentaje IS NULL OR (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100));
  END IF;
END $$;

-- 3) Backfill desde columnas existentes (sin romper si alguna no existe)
DO $$
DECLARE
  has_code BOOLEAN;
  has_price BOOLEAN;
  has_price_before BOOLEAN;
  has_images BOOLEAN;
  images_udt TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='code'
  ) INTO has_code;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='price'
  ) INTO has_price;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='price_before'
  ) INTO has_price_before;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='images'
  ) INTO has_images;

  IF has_code THEN
    EXECUTE $sql$
      UPDATE public.products
      SET sku = NULLIF(TRIM(code), '')
      WHERE (sku IS NULL OR TRIM(sku) = '')
        AND code IS NOT NULL
        AND TRIM(code) <> ''
    $sql$;
  END IF;

  IF has_price AND has_price_before THEN
    EXECUTE $sql$
      UPDATE public.products
      SET
        precio_normal = COALESCE(precio_normal, price_before, price),
        precio_catalogo = COALESCE(precio_catalogo, price_before, price),
        precio_oferta = COALESCE(precio_oferta, price),
        descuento_porcentaje = COALESCE(
          descuento_porcentaje,
          CASE
            WHEN COALESCE(price_before, 0) > 0 AND price_before > price
              THEN ROUND(((price_before - price) / price_before) * 100)::INTEGER
            ELSE NULL
          END
        )
      WHERE price IS NOT NULL OR price_before IS NOT NULL
    $sql$;
  ELSIF has_price THEN
    EXECUTE $sql$
      UPDATE public.products
      SET
        precio_normal = COALESCE(precio_normal, price),
        precio_catalogo = COALESCE(precio_catalogo, price),
        precio_oferta = COALESCE(precio_oferta, price)
      WHERE price IS NOT NULL
    $sql$;
  END IF;

  UPDATE public.products
  SET resumen = LEFT(description, 220)
  WHERE (resumen IS NULL OR TRIM(resumen) = '')
    AND description IS NOT NULL
    AND TRIM(description) <> '';

  IF has_images THEN
    SELECT c.udt_name
    INTO images_udt
    FROM information_schema.columns c
    WHERE c.table_schema='public' AND c.table_name='products' AND c.column_name='images';

    IF images_udt = '_text' THEN
      EXECUTE $sql$
        UPDATE public.products
        SET
          imagen_principal = COALESCE(imagen_principal, images[1]),
          galeria_imagenes = CASE
            WHEN galeria_imagenes IS NULL OR array_length(galeria_imagenes, 1) IS NULL THEN COALESCE(images, '{}'::text[])
            ELSE galeria_imagenes
          END
        WHERE images IS NOT NULL
      $sql$;
    ELSIF images_udt = 'jsonb' THEN
      EXECUTE $sql$
        UPDATE public.products
        SET
          imagen_principal = COALESCE(imagen_principal, images->>0),
          galeria_imagenes = CASE
            WHEN galeria_imagenes IS NULL OR array_length(galeria_imagenes, 1) IS NULL
              THEN COALESCE(ARRAY(SELECT jsonb_array_elements_text(images)), '{}'::text[])
            ELSE galeria_imagenes
          END
        WHERE images IS NOT NULL
      $sql$;
    END IF;
  END IF;
END $$;

-- 4) Indices utiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique_not_null
  ON public.products (sku)
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_nso ON public.products(nso);
CREATE INDEX IF NOT EXISTS idx_products_precio_oferta ON public.products(precio_oferta);
CREATE INDEX IF NOT EXISTS idx_products_campaign_id ON public.products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);

-- 5) Trigger para updated_at automatico
CREATE OR REPLACE FUNCTION public.set_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_products_updated_at'
      AND tgrelid = 'public.products'::regclass
  ) THEN
    CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_products_updated_at();
  END IF;
END $$;

COMMIT;

-- =========================================
-- MIGRACION: 20260401_add_price_before_to_products.sql
-- =========================================
-- Agregar columna price_before a products para gestionar precios con descuento
-- Esto permite diferenciar el precio original y el precio con descuento

DO $$
BEGIN
  -- Verificar si la columna ya existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'price_before'
  ) THEN
    ALTER TABLE public.products
    ADD COLUMN price_before NUMERIC DEFAULT NULL;
  END IF;
END
$$;

-- Crear Ã­ndice para bÃºsquedas rÃ¡pidas
CREATE INDEX IF NOT EXISTS idx_products_price_before ON public.products(price_before);

-- =========================================
-- MIGRACION: 20260401_fix_price_before_schema_cache.sql
-- =========================================
-- Fix rapido para error:
-- Could not find the 'price_before' column of 'products' in the schema cache
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- 1) Crear columna si no existe
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_before NUMERIC(10,2);

-- 2) Backfill opcional para datos existentes
-- Prioridad: precio_normal -> precio_catalogo -> price
UPDATE public.products
SET price_before = COALESCE(price_before, precio_normal, precio_catalogo, price)
WHERE price_before IS NULL;

COMMIT;

-- 3) Forzar recarga de schema cache de PostgREST (Supabase API)
NOTIFY pgrst, 'reload schema';

-- 4) Verificacion
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name = 'price_before';

-- =========================================
-- MIGRACION: 20260415_create_assistant_chat_tables.sql
-- =========================================
-- AMYSA AI: conversaciones de clientes + trazabilidad de leads para admin

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'lead', 'closed')),
  lead_stage text not null default 'nuevo' check (lead_stage in ('nuevo', 'contactado', 'en_seguimiento', 'cerrado', 'descartado')),
  lead_score integer not null default 0,
  lead_summary text,
  source text not null default 'amysa_ai',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('client', 'assistant', 'admin', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_sessions_client_id on public.chat_sessions(client_id);
create index if not exists idx_chat_sessions_last_message_at on public.chat_sessions(last_message_at desc);
create index if not exists idx_chat_messages_session_id_created_at on public.chat_messages(session_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own"
  on public.chat_sessions
  for select
  to authenticated
  using (auth.uid() = client_id);

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own"
  on public.chat_sessions
  for insert
  to authenticated
  with check (auth.uid() = client_id);

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own"
  on public.chat_sessions
  for update
  to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

drop policy if exists "chat_messages_select_own_session" on public.chat_messages;
create policy "chat_messages_select_own_session"
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_sessions sessions
      where sessions.id = chat_messages.session_id
        and sessions.client_id = auth.uid()
    )
  );

drop policy if exists "chat_messages_insert_client_own_session" on public.chat_messages;
create policy "chat_messages_insert_client_own_session"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    sender = 'client'
    and exists (
      select 1
      from public.chat_sessions sessions
      where sessions.id = chat_messages.session_id
        and sessions.client_id = auth.uid()
    )
  );

-- =========================================
-- MIGRACION: 20260415_create_marketing_modules.sql
-- =========================================
-- Modulo de marketing: cupones y mensajes de preencabezado

create table if not exists public.marketing_coupons (
  id bigint generated by default as identity primary key,
  code text not null,
  description text,
  discount_type text not null default 'percent',
  discount_value numeric(10,2) not null,
  min_subtotal numeric(10,2) not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_coupons_discount_type_check check (discount_type in ('percent', 'fixed')),
  constraint marketing_coupons_discount_value_check check (discount_value > 0),
  constraint marketing_coupons_min_subtotal_check check (min_subtotal >= 0)
);

create unique index if not exists idx_marketing_coupons_code_unique on public.marketing_coupons ((upper(code)));
create index if not exists idx_marketing_coupons_active on public.marketing_coupons (active);

create table if not exists public.marketing_preheader_messages (
  id bigint generated by default as identity primary key,
  message text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_preheader_messages_active_sort
  on public.marketing_preheader_messages (active, sort_order, id);

insert into public.marketing_preheader_messages (message, sort_order, active)
select 'CUPON DE APERTURA: AMYSA2026', 10, true
where not exists (select 1 from public.marketing_preheader_messages where message = 'CUPON DE APERTURA: AMYSA2026');

insert into public.marketing_preheader_messages (message, sort_order, active)
select 'PROMOCIONES DIA DE LA MADRE - COMPRA HOY', 20, true
where not exists (select 1 from public.marketing_preheader_messages where message = 'PROMOCIONES DIA DE LA MADRE - COMPRA HOY');

insert into public.marketing_preheader_messages (message, sort_order, active)
select 'ENVIO RAPIDO Y ATENCION PERSONALIZADA', 30, true
where not exists (select 1 from public.marketing_preheader_messages where message = 'ENVIO RAPIDO Y ATENCION PERSONALIZADA');

insert into public.marketing_preheader_messages (message, sort_order, active)
select 'NUEVOS INGRESOS TODAS LAS SEMANAS', 40, true
where not exists (select 1 from public.marketing_preheader_messages where message = 'NUEVOS INGRESOS TODAS LAS SEMANAS');

insert into public.marketing_preheader_messages (message, sort_order, active)
select 'APROVECHA OFERTAS EXCLUSIVAS ONLINE', 50, true
where not exists (select 1 from public.marketing_preheader_messages where message = 'APROVECHA OFERTAS EXCLUSIVAS ONLINE');

alter table public.marketing_coupons enable row level security;
alter table public.marketing_preheader_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'marketing_coupons' and policyname = 'marketing_coupons_public_select_active'
  ) then
    create policy marketing_coupons_public_select_active
      on public.marketing_coupons
      for select
      to anon, authenticated
      using (
        active = true
        and (starts_at is null or starts_at <= now())
        and (ends_at is null or ends_at >= now())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'marketing_coupons' and policyname = 'marketing_coupons_service_all'
  ) then
    create policy marketing_coupons_service_all
      on public.marketing_coupons
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'marketing_preheader_messages' and policyname = 'marketing_preheader_public_select_active'
  ) then
    create policy marketing_preheader_public_select_active
      on public.marketing_preheader_messages
      for select
      to anon, authenticated
      using (active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'marketing_preheader_messages' and policyname = 'marketing_preheader_service_all'
  ) then
    create policy marketing_preheader_service_all
      on public.marketing_preheader_messages
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

-- =========================================
-- MIGRACION: 20260415_add_chat_lead_fields.sql
-- =========================================
-- Agrega campos para capturar datos de lead en el chat de AMYSA

alter table public.chat_sessions
  add column if not exists lead_name text,
  add column if not exists lead_phone text,
  add column if not exists lead_email text,
  add column if not exists lead_interest text,
  add column if not exists lead_category text,
  add column if not exists lead_brand text;

create index if not exists idx_chat_sessions_lead_email on public.chat_sessions(lead_email);
create index if not exists idx_chat_sessions_lead_phone on public.chat_sessions(lead_phone);

-- =========================================
-- MIGRACION: 20260415_add_orders_delivery_discount_columns.sql
-- =========================================
-- Campos comerciales para checkout: entrega, envio y cupones

alter table public.orders
  add column if not exists delivery_method text,
  add column if not exists shipping_amount numeric(10,2),
  add column if not exists discount_amount numeric(10,2),
  add column if not exists subtotal_amount numeric(10,2),
  add column if not exists coupon_code text;

create index if not exists idx_orders_delivery_method on public.orders(delivery_method);
create index if not exists idx_orders_coupon_code on public.orders(coupon_code);

-- =========================================
-- MIGRACION: 20260415_add_profiles_avatar_storage.sql
-- =========================================
-- Agrega avatar_url al perfil y configura bucket para avatares de usuario

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is 'URL publica de foto de perfil del usuario';

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_avatars_insert_own'
  ) THEN
    CREATE POLICY profile_avatars_insert_own
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'profile-avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_avatars_update_own'
  ) THEN
    CREATE POLICY profile_avatars_update_own
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'profile-avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'profile-avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_avatars_delete_own'
  ) THEN
    CREATE POLICY profile_avatars_delete_own
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'profile-avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END
$$;

-- =========================================
-- MIGRACION: 20260415_add_profiles_gender.sql
-- =========================================
-- Agrega genero al perfil para personalizar mensajes de asesor/asesora

alter table public.profiles
  add column if not exists gender text;

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (
    gender is null
    or lower(gender) in ('male', 'female', 'masculino', 'femenino', 'hombre', 'mujer')
  );

comment on column public.profiles.gender is 'Genero para personalizacion de mensajes: male/female (o equivalentes en es).';

-- =========================================
-- MIGRACION: 20260415_enable_admin_chat_realtime.sql
-- =========================================
-- Habilita modo asesor en tiempo real (admin/vendedora) para chats de AMYSA AI

alter table public.chat_sessions
  add column if not exists joined_by_admin_id uuid references auth.users(id),
  add column if not exists joined_at timestamptz;

create or replace function public.is_chat_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          coalesce(lower(p.role), '') in ('superadmin', 'administrador', 'duena', 'dueÃ±a', 'vendedora', 'socia')
          or coalesce(p.is_admin, false) = true
        )
    )
    or coalesce(lower(auth.jwt() -> 'user_metadata' ->> 'role'), '') in ('superadmin', 'administrador', 'admin', 'duena', 'dueÃ±a', 'vendedora', 'socia');
$$;

grant execute on function public.is_chat_admin() to authenticated;

drop policy if exists "chat_sessions_admin_select_all" on public.chat_sessions;
create policy "chat_sessions_admin_select_all"
  on public.chat_sessions
  for select
  to authenticated
  using (public.is_chat_admin());

drop policy if exists "chat_sessions_admin_update_all" on public.chat_sessions;
create policy "chat_sessions_admin_update_all"
  on public.chat_sessions
  for update
  to authenticated
  using (public.is_chat_admin())
  with check (public.is_chat_admin());

drop policy if exists "chat_messages_admin_select_all" on public.chat_messages;
create policy "chat_messages_admin_select_all"
  on public.chat_messages
  for select
  to authenticated
  using (public.is_chat_admin());

drop policy if exists "chat_messages_admin_insert" on public.chat_messages;
create policy "chat_messages_admin_insert"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    public.is_chat_admin()
    and sender = 'admin'
  );

alter table public.chat_sessions replica identity full;
alter table public.chat_messages replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.chat_sessions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;

-- =========================================
-- MIGRACION: 20260415_fix_chat_messages_admin_insert_policy.sql
-- =========================================
-- Permite que asesor/admin publique mensajes de sistema en chat_messages

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_admin_insert" on public.chat_messages;
create policy "chat_messages_admin_insert"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    public.is_chat_admin()
    and sender in ('admin', 'system')
  );

-- =========================================
-- MIGRACION: 20260415_normalize_profiles_gender_values.sql
-- =========================================
-- Normaliza valores antiguos de genero y restringe a masculino/femenino

update public.profiles
set gender = case
  when gender is null then null
  when lower(trim(gender)) in ('f', 'female', 'femenino', 'femenina', 'mujer', 'woman') then 'femenino'
  when lower(trim(gender)) in ('m', 'male', 'masculino', 'hombre', 'man') then 'masculino'
  when trim(gender) = '' then null
  else null
end;

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (
    gender is null
    or lower(gender) in ('masculino', 'femenino')
  );

comment on column public.profiles.gender is 'Genero normalizado del usuario: masculino o femenino';

-- =========================================
-- MIGRACION: 20260417_add_inventory_cost_columns.sql
-- =========================================
-- Agregar columnas de costo e inventario a la tabla products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS operating_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin NUMERIC(5, 2) DEFAULT 0;

-- Crear Ã­ndices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_products_cost ON products(cost);
CREATE INDEX IF NOT EXISTS idx_products_operating_cost ON products(operating_cost);
CREATE INDEX IF NOT EXISTS idx_products_profit_margin ON products(profit_margin);

-- =========================================
-- MIGRACION: 20260421_create_cash_register_module.sql
-- =========================================
-- Modulo Caja AMySA: registro de ingresos y egresos

create table if not exists public.amysa_cash_income (
  id bigint generated by default as identity primary key,
  product_id text not null,
  product_name text not null,
  unit_type text not null default 'unidad',
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  total numeric(12,2) not null default 0,
  was_sold boolean not null default true,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  constraint amysa_cash_income_unit_type_check check (unit_type in ('unidad', 'caja', 'paquete')),
  constraint amysa_cash_income_quantity_check check (quantity > 0),
  constraint amysa_cash_income_unit_price_check check (unit_price >= 0),
  constraint amysa_cash_income_total_check check (total >= 0)
);

create index if not exists idx_amysa_cash_income_created_at
  on public.amysa_cash_income (created_at desc);

create index if not exists idx_amysa_cash_income_product_name
  on public.amysa_cash_income (product_name);

create table if not exists public.amysa_cash_expense (
  id bigint generated by default as identity primary key,
  concept text not null,
  expense_type text not null default 'general',
  amount numeric(12,2) not null default 0,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  constraint amysa_cash_expense_type_check check (expense_type in ('compra', 'general')),
  constraint amysa_cash_expense_amount_check check (amount >= 0)
);

create index if not exists idx_amysa_cash_expense_created_at
  on public.amysa_cash_expense (created_at desc);

create index if not exists idx_amysa_cash_expense_type
  on public.amysa_cash_expense (expense_type);

alter table public.amysa_cash_income enable row level security;
alter table public.amysa_cash_expense enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'amysa_cash_income' and policyname = 'amysa_cash_income_service_all'
  ) then
    create policy amysa_cash_income_service_all
      on public.amysa_cash_income
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'amysa_cash_expense' and policyname = 'amysa_cash_expense_service_all'
  ) then
    create policy amysa_cash_expense_service_all
      on public.amysa_cash_expense
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

-- =========================================
-- MIGRACION: 20260421_add_cash_income_shipping_method.sql
-- =========================================
-- Agrega metodo de envio a los ingresos de Caja AMYSA

ALTER TABLE public.amysa_cash_income
ADD COLUMN IF NOT EXISTS shipping_method text NOT NULL DEFAULT 'shipping_lima';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'amysa_cash_income_shipping_method_check'
      AND conrelid = 'public.amysa_cash_income'::regclass
  ) THEN
    ALTER TABLE public.amysa_cash_income
      ADD CONSTRAINT amysa_cash_income_shipping_method_check
      CHECK (shipping_method IN ('pickup_lima_points', 'shipping_lima', 'shipping_provincia'));
  END IF;
END $$;

COMMENT ON COLUMN public.amysa_cash_income.shipping_method IS 'Metodo de envio asociado al ingreso de venta.';
-- =========================================
-- MIGRACION: 20260421_add_cash_seller_and_payment_method.sql
-- =========================================
-- Caja AMYSA: agregar vendedor y metodo de pago/gasto

alter table if exists public.amysa_cash_income
  add column if not exists seller_id text,
  add column if not exists seller_name text,
  add column if not exists payment_method text not null default 'efectivo';

alter table if exists public.amysa_cash_expense
  add column if not exists payment_method text not null default 'efectivo';

create index if not exists idx_amysa_cash_income_seller_id
  on public.amysa_cash_income (seller_id);

create index if not exists idx_amysa_cash_income_payment_method
  on public.amysa_cash_income (payment_method);

create index if not exists idx_amysa_cash_expense_payment_method
  on public.amysa_cash_expense (payment_method);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'amysa_cash_income_payment_method_check'
      and conrelid = 'public.amysa_cash_income'::regclass
  ) then
    alter table public.amysa_cash_income
      add constraint amysa_cash_income_payment_method_check
      check (payment_method in ('efectivo', 'yape', 'transferencia', 'tarjeta_credito', 'plin', 'otro'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'amysa_cash_expense_payment_method_check'
      and conrelid = 'public.amysa_cash_expense'::regclass
  ) then
    alter table public.amysa_cash_expense
      add constraint amysa_cash_expense_payment_method_check
      check (payment_method in ('efectivo', 'yape', 'transferencia', 'tarjeta_credito', 'plin', 'otro'));
  end if;
end
$$;

-- =========================================
-- MIGRACION: 20260421_add_products_gender.sql
-- =========================================
-- Agrega el campo gender a products para soportar el formulario de inventario

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS gender TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_gender_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_gender_check
      CHECK (
        gender IS NULL
        OR lower(gender) IN ('hombre', 'mujer', 'ninos', 'niÃ±os')
      );
  END IF;
END $$;

COMMENT ON COLUMN public.products.gender IS 'Genero del producto para filtrado y clasificacion en inventario.';
-- =========================================
-- MIGRACION: 20260427_add_products_age_group.sql
-- =========================================
alter table public.products
add column if not exists age_group text;

comment on column public.products.age_group is 'Grupo etario del producto para filtros de tienda: adultos, ninos, bebes o unisex.';

do $$
begin
  alter table public.products
    add constraint products_age_group_check
    check (age_group is null or age_group in ('adultos', 'ninos', 'bebes', 'unisex'));
exception
  when duplicate_object then null;
end $$;
-- =========================================
-- MIGRACION: 20260430_create_genders_age_groups.sql
-- =========================================
-- Crea tablas maestras para gÃ©neros y grupos de edad
-- Idempotente â€” ejecutar desde Supabase SQL Editor o con migraciones

BEGIN;

-- Asegurar extensiÃ³n para UUID
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

-- =========================================
-- MIGRACION: 20260430_relax_products_age_group_check.sql
-- =========================================
-- Permite guardar grupos de edad dinÃ¡micos registrados en el mÃ³dulo Tienda
-- Quita la restricciÃ³n rÃ­gida de valores en products.age_group

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_age_group_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT products_age_group_check;
  END IF;
END $$;

-- =========================================
-- MIGRACION: 20260430_relax_products_gender_check.sql
-- =========================================
-- Permite guardar gÃ©neros dinÃ¡micos registrados en el mÃ³dulo Tienda
-- Quita la restricciÃ³n rÃ­gida de valores en products.gender

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_gender_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT products_gender_check;
  END IF;
END $$;

-- =========================================
-- MIGRACION: 20260501_backfill_products_default_cover_image.sql
-- =========================================
-- Normaliza portada de productos para usar AMYSA Shop como imagen por defecto.
-- No toca productos con portada real.

DO $$
DECLARE
  fallback_image CONSTANT text := '/logos/amysa%20shop.png';
BEGIN
  -- Si images viene nulo o no es arreglo, lo normalizamos al fallback.
  UPDATE public.products
  SET images = jsonb_build_array(fallback_image)
  WHERE images IS NULL
    OR jsonb_typeof(images) <> 'array';

  -- Si el arreglo de imÃ¡genes estÃ¡ vacÃ­o, asignamos fallback.
  UPDATE public.products
  SET images = jsonb_build_array(fallback_image)
  WHERE jsonb_typeof(images) = 'array'
    AND jsonb_array_length(images) = 0;

  -- Si no hay portada vÃ¡lida (primer elemento vacÃ­o), forzamos fallback como portada.
  UPDATE public.products
  SET images = jsonb_set(images, '{0}', to_jsonb(fallback_image), true)
  WHERE jsonb_typeof(images) = 'array'
    AND jsonb_array_length(images) > 0
    AND COALESCE(NULLIF(btrim(images->>0), ''), '') = '';

  -- Reemplaza portadas previas de fallback por el nuevo logo AMYSA Shop.
  UPDATE public.products
  SET images = jsonb_set(images, '{0}', to_jsonb(fallback_image), true)
  WHERE jsonb_typeof(images) = 'array'
    AND jsonb_array_length(images) > 0
    AND lower(btrim(images->>0)) IN (
      '/logos/amysa-square-primary.png',
      '/logos/amysa square primary.png',
      'https://rzsgflwlbbxzjvyegshs.supabase.co/storage/v1/object/public/products/products/1777623814788-oc96ezky.png'
    );
END
$$;
-- =========================================
-- MIGRACION: 20260504_add_profiles_img_avatar.sql
-- =========================================
-- Agrega la columna dedicada para la imagen de avatar del perfil

alter table public.profiles
  add column if not exists img_avatar text;

comment on column public.profiles.img_avatar is 'URL publica de la imagen de avatar del perfil del usuario';

update public.profiles
set img_avatar = nullif(btrim(coalesce(img_avatar, avatar_url)), '')
where img_avatar is null
  and nullif(btrim(coalesce(img_avatar, avatar_url)), '') is not null;

-- =========================================
-- MIGRACION: 20260527_add_seller_markup_percentage_to_products.sql
-- =========================================
-- Agregar porcentaje para vendedoras al inventario
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seller_markup_percentage NUMERIC(5, 2) DEFAULT 0;

UPDATE public.products
SET seller_markup_percentage = COALESCE(seller_markup_percentage, 0)
WHERE seller_markup_percentage IS NULL;

-- =========================================
-- MIGRACION: 20260528_disable_old_sales_triggers.sql
-- =========================================
-- Migration: disable_old_sales_triggers
-- Drops legacy sales triggers that conflict with the current Emprende flow.
-- The application now handles stock and commission logic explicitly.

BEGIN;

DROP TRIGGER IF EXISTS create_commission_on_insert ON public.sales;
DROP TRIGGER IF EXISTS decrease_stock_on_sale ON public.sales;
DROP TRIGGER IF EXISTS restore_stock_on_sale_delete ON public.sales;
DROP TRIGGER IF EXISTS update_commission_on_payment_change ON public.sales;

COMMIT;

-- =========================================
-- MIGRACION: 20260528_insert_sale_with_commission.sql
-- =========================================
-- Migration: insert_sale_with_commission
-- Creates a stored function that inserts a sale and its commission atomically.
-- Run this in your Supabase SQL editor or apply as a migration.

BEGIN;

/*
Function: insert_sale_with_commission
Inserts a row into public.sales and, when applicable, a related row into public.sales_commissions
in a single transaction to avoid foreign-key races.
*/
DROP FUNCTION IF EXISTS public.insert_sale_with_commission(
  uuid,
  uuid,
  uuid,
  uuid,
  integer,
  numeric,
  numeric,
  text,
  numeric,
  numeric,
  numeric,
  text,
  text
);

CREATE OR REPLACE FUNCTION public.insert_sale_with_commission(
  p_salesperson_id uuid,
  p_product_id uuid,
  p_client_id uuid DEFAULT NULL,
  p_external_client_id uuid DEFAULT NULL,
  p_quantity integer DEFAULT 1,
  p_unit_price numeric DEFAULT 0,
  p_total_amount numeric DEFAULT 0,
  p_payment_status text DEFAULT 'pending',
  p_payment_received numeric DEFAULT 0,
  p_commission_percentage numeric DEFAULT 0,
  p_commission_amount numeric DEFAULT 0,
  p_commission_status text DEFAULT 'pending',
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_sale_id uuid;
BEGIN
  INSERT INTO public.sales (
    salesperson_id, product_id, client_id, external_client_id, quantity,
    unit_price, total_amount, payment_status, payment_received, commission_status,
    commission_amount, notes
  ) VALUES (
    p_salesperson_id, p_product_id, p_client_id, p_external_client_id, p_quantity,
    p_unit_price, p_total_amount, p_payment_status, p_payment_received, p_commission_status,
    p_commission_amount, p_notes
  )
  RETURNING id INTO v_sale_id;

    IF p_commission_amount > 0 THEN
    INSERT INTO public.sales_commissions (
      sale_id, salesperson_id, commission_percentage, commission_amount, status
    ) VALUES (
      v_sale_id, p_salesperson_id, p_commission_percentage, p_commission_amount, p_commission_status
    );
  END IF;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- =========================================
-- MIGRACION: 20260529_create_app_settings.sql
-- =========================================
-- Central de configuracion para checkout y panel admin

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;


