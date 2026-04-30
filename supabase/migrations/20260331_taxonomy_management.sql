-- Estructura maestra para marcas/submarcas y categorías/subcategorías
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

-- 3) Tabla de subcategorías (hijas de una categoría)
CREATE TABLE IF NOT EXISTS public.sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, name)
);

-- Índices recomendados
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
