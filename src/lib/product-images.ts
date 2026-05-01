export const DEFAULT_PRODUCT_IMAGE = "/logos/amysa%20shop.png";

export function isSafeProductImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

export function getSafeProductImageSrc(images: string[]) {
  const candidate = (images || []).find((value) => isSafeProductImageSrc(value) && !/\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(value));
  return candidate || DEFAULT_PRODUCT_IMAGE;
}