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
