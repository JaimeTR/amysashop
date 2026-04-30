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
        OR lower(gender) IN ('hombre', 'mujer', 'ninos', 'niños')
      );
  END IF;
END $$;

COMMENT ON COLUMN public.products.gender IS 'Genero del producto para filtrado y clasificacion en inventario.';