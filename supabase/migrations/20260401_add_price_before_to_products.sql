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

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_products_price_before ON public.products(price_before);
