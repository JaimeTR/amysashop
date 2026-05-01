-- Normaliza portada de productos para usar AMYSA Shop como imagen por defecto.
-- No toca productos con portada real.

DO $$
DECLARE
  fallback_image CONSTANT text := '/logos/amysa%20shop.png';
BEGIN
  -- Si images viene nulo o no es arreglo, lo normalizamos al fallback.
  UPDATE public.products
  SET images = jsonb_build_array(fallback_image)
  WHERE images IS NULL
    OR jsonb_typeof(images) <> 'array';

  -- Si el arreglo de imágenes está vacío, asignamos fallback.
  UPDATE public.products
  SET images = jsonb_build_array(fallback_image)
  WHERE jsonb_typeof(images) = 'array'
    AND jsonb_array_length(images) = 0;

  -- Si no hay portada válida (primer elemento vacío), forzamos fallback como portada.
  UPDATE public.products
  SET images = jsonb_set(images, '{0}', to_jsonb(fallback_image), true)
  WHERE jsonb_typeof(images) = 'array'
    AND jsonb_array_length(images) > 0
    AND COALESCE(NULLIF(btrim(images->>0), ''), '') = '';

  -- Reemplaza portadas previas de fallback por el nuevo logo AMYSA Shop.
  UPDATE public.products
  SET images = jsonb_set(images, '{0}', to_jsonb(fallback_image), true)
  WHERE jsonb_typeof(images) = 'array'
    AND jsonb_array_length(images) > 0
    AND lower(btrim(images->>0)) IN (
      '/logos/amysa-square-primary.png',
      '/logos/amysa square primary.png',
      'https://rzsgflwlbbxzjvyegshs.supabase.co/storage/v1/object/public/products/products/1777623814788-oc96ezky.png'
    );
END
$$;