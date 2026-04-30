-- Asegura soporte de imágenes para productos
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

  -- Si no existe, la creamos como jsonb para máxima compatibilidad.
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

-- 2) Bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;
