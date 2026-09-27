export const DEFAULT_PRODUCT_IMAGE = "/logos/amysa%20shop.png";

export function isSafeProductImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

export function getSafeProductImageSrc(images: string[]) {
  const candidate = (images || []).find((value) => isSafeProductImageSrc(value) && !/\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(value));
  return candidate || DEFAULT_PRODUCT_IMAGE;
}
// next/image solo puede optimizar hosts configurados en next.config (Supabase y archivos locales).
// Para URLs pegadas de otros sitios se usa la imagen original para no romperla.
export function isOptimizableImageSrc(value: string) {
  const src = String(value || "").trim();
  if (src.startsWith("/")) return true;
  try {
    const { hostname } = new URL(src);
    return hostname.endsWith(".supabase.co") || hostname.endsWith(".vtexassets.com");
  } catch {
    return false;
  }
}
