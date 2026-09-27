export function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (!vercelUrl) {
    return "https://amysashop.com";
  }

  return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

// Imagen por defecto al compartir en redes/WhatsApp (se repite en cada openGraph de página,
// porque Next reemplaza el openGraph del layout en vez de combinarlo).
export const DEFAULT_OG_IMAGE = { url: "/icons/og-image.png", width: 1200, height: 630, alt: "AMYSA SHOP" };
