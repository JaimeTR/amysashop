-- Extiende products con atributos de perfumeria (idempotente)
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- 1) Nuevas columnas (compatibles con esquema actual)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS nso TEXT,
  ADD COLUMN IF NOT EXISTS precio_normal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS precio_catalogo NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS precio_oferta NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS descuento_porcentaje INTEGER,
  ADD COLUMN IF NOT EXISTS resumen TEXT,
  ADD COLUMN IF NOT EXISTS contenido TEXT,
  ADD COLUMN IF NOT EXISTS regalos TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS imagen_principal TEXT,
  ADD COLUMN IF NOT EXISTS galeria_imagenes TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_pack BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 2) Restriccion de descuento (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_descuento_porcentaje_chk'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_descuento_porcentaje_chk
      CHECK (descuento_porcentaje IS NULL OR (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100));
  END IF;
END $$;

-- 3) Backfill desde columnas existentes (sin romper si alguna no existe)
DO $$
DECLARE
  has_code BOOLEAN;
  has_price BOOLEAN;
  has_price_before BOOLEAN;
  has_images BOOLEAN;
  images_udt TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='code'
  ) INTO has_code;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='price'
  ) INTO has_price;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='price_before'
  ) INTO has_price_before;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='images'
  ) INTO has_images;

  IF has_code THEN
    EXECUTE $sql$
      UPDATE public.products
      SET sku = NULLIF(TRIM(code), '')
      WHERE (sku IS NULL OR TRIM(sku) = '')
        AND code IS NOT NULL
        AND TRIM(code) <> ''
    $sql$;
  END IF;

  IF has_price AND has_price_before THEN
    EXECUTE $sql$
      UPDATE public.products
      SET
        precio_normal = COALESCE(precio_normal, price_before, price),
        precio_catalogo = COALESCE(precio_catalogo, price_before, price),
        precio_oferta = COALESCE(precio_oferta, price),
        descuento_porcentaje = COALESCE(
          descuento_porcentaje,
          CASE
            WHEN COALESCE(price_before, 0) > 0 AND price_before > price
              THEN ROUND(((price_before - price) / price_before) * 100)::INTEGER
            ELSE NULL
          END
        )
      WHERE price IS NOT NULL OR price_before IS NOT NULL
    $sql$;
  ELSIF has_price THEN
    EXECUTE $sql$
      UPDATE public.products
      SET
        precio_normal = COALESCE(precio_normal, price),
        precio_catalogo = COALESCE(precio_catalogo, price),
        precio_oferta = COALESCE(precio_oferta, price)
      WHERE price IS NOT NULL
    $sql$;
  END IF;

  UPDATE public.products
  SET resumen = LEFT(description, 220)
  WHERE (resumen IS NULL OR TRIM(resumen) = '')
    AND description IS NOT NULL
    AND TRIM(description) <> '';

  IF has_images THEN
    SELECT c.udt_name
    INTO images_udt
    FROM information_schema.columns c
    WHERE c.table_schema='public' AND c.table_name='products' AND c.column_name='images';

    IF images_udt = '_text' THEN
      EXECUTE $sql$
        UPDATE public.products
        SET
          imagen_principal = COALESCE(imagen_principal, images[1]),
          galeria_imagenes = CASE
            WHEN galeria_imagenes IS NULL OR array_length(galeria_imagenes, 1) IS NULL THEN COALESCE(images, '{}'::text[])
            ELSE galeria_imagenes
          END
        WHERE images IS NOT NULL
      $sql$;
    ELSIF images_udt = 'jsonb' THEN
      EXECUTE $sql$
        UPDATE public.products
        SET
          imagen_principal = COALESCE(imagen_principal, images->>0),
          galeria_imagenes = CASE
            WHEN galeria_imagenes IS NULL OR array_length(galeria_imagenes, 1) IS NULL
              THEN COALESCE(ARRAY(SELECT jsonb_array_elements_text(images)), '{}'::text[])
            ELSE galeria_imagenes
          END
        WHERE images IS NOT NULL
      $sql$;
    END IF;
  END IF;
END $$;

-- 4) Indices utiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique_not_null
  ON public.products (sku)
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_nso ON public.products(nso);
CREATE INDEX IF NOT EXISTS idx_products_precio_oferta ON public.products(precio_oferta);
CREATE INDEX IF NOT EXISTS idx_products_campaign_id ON public.products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);

-- 5) Trigger para updated_at automatico
CREATE OR REPLACE FUNCTION public.set_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_products_updated_at'
      AND tgrelid = 'public.products'::regclass
  ) THEN
    CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_products_updated_at();
  END IF;
END $$;

COMMIT;
