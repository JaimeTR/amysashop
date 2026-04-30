# Instrucciones: Ejecutar Migraciones en Supabase

## Problema
Los productos no tienen columnas nativas para `brand`, `sub_brand`, `sub_category`, por lo que el sistema no puede persistir esas relacionadas en tablas maestras.

## Solución
Ejecutar **en orden** estas migraciones en el SQL Editor de Supabase:

### 1️⃣ Primero: Agregar columnas faltantes
Copia y ejecuta el contenido de `supabase/migrations/20260330_add_product_columns.sql`:

```sql
-- Agregar columnas faltantes a productos para soporte de marca/submarca/subcategoría nativos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS sub_brand TEXT,
ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sub_brand ON public.products(sub_brand);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON public.products(sub_category);
```

### 2️⃣ Después: Crear tablas maestras de taxonomía
Copia y ejecuta el contenido de `supabase/migrations/20260331_taxonomy_management.sql`:

```sql
-- Estructura maestra para marcas/submarcas y categorías/subcategorías
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
```

## Pasos:
1. Abre https://app.supabase.com → Tu proyecto → SQL Editor
2. Copia el script del paso 1️⃣ y ejecuta
3. Copia el script del paso 2️⃣ y ejecuta
4. En tu app → /admin/tienda crearás marcas/submarcas/categorías
5. En /admin/productos verás los combobox poblados

Listo, la migración está lista para ejecutar.
