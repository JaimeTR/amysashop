import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// Páginas privadas o sin valor para buscadores (cuenta, compra, admin, flujos de login).
const PRIVATE_PATHS = [
  "/admin",
  "/api",
  "/checkout",
  "/carrito",
  "/perfil",
  "/favoritos",
  "/login",
  "/registro",
  "/recuperar",
  "/restablecer",
  "/cuenta-verificada",
  "/acceso-restringido",
  "/setup-admin",
  "/auth",
  "/gracias",
  "/banner",
  "/digital/admin",
  "/digital/descargas",
  "/digital/gracias",
];

// Buscadores con IA (GEO): se permiten para que puedan citar el catálogo y la ayuda.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
