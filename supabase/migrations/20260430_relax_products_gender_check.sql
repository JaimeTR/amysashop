-- Permite guardar géneros dinámicos registrados en el módulo Tienda
-- Quita la restricción rígida de valores en products.gender

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
