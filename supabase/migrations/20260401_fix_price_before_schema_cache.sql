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
