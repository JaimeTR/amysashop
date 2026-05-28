-- Agregar porcentaje para vendedoras al inventario
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS seller_markup_percentage NUMERIC(5, 2) DEFAULT 0;

UPDATE public.products
SET seller_markup_percentage = COALESCE(seller_markup_percentage, 0)
WHERE seller_markup_percentage IS NULL;
