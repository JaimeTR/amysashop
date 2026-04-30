-- Agregar columnas faltantes a productos para soporte de marca/submarca/subcategoría nativos
-- Esta migración se ejecuta antes de 20260331_taxonomy_management.sql

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS sub_brand TEXT,
ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sub_brand ON public.products(sub_brand);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON public.products(sub_category);
