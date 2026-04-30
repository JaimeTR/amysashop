-- Permite guardar grupos de edad dinámicos registrados en el módulo Tienda
-- Quita la restricción rígida de valores en products.age_group

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
