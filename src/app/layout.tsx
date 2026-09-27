import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { DevServiceWorkerCleanup } from "@/components/pwa/dev-service-worker-cleanup";
import { NotificationProvider } from "@/components/feedback/notification-center";
import { AmysaAssistantWidget } from "@/components/chat/amysa-assistant-widget";
import { getActiveProductsForNav, getRegisteredCategories, checkSupabase } from "@/lib/catalog";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { MaintenanceScreen } from "@/components/maintenance/maintenance-screen";
import { getSiteUrl } from "@/lib/site-url";
import { headers } from "next/headers";

const APP_VERSION = "0.1.2";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

type RouteScope = "public" | "admin" | "banner";

function normalizeRouteScope(routeScope: string | null): RouteScope {
  if (routeScope === "admin" || routeScope === "banner" || routeScope === "public") {
    return routeScope;
  }

  return "public";
}

export const metadata: Metadata = {
  applicationName: "AMYSA SHOP",
  title: {
    default: "AMYSA SHOP",
    template: "%s | AMYSA SHOP",
  },
  description:
    "AMYSA SHOP: tienda online en Perú de perfumes, maquillaje, cuidado personal y accesorios de Ésika, L'Bel, Cyzone y Yanbal. Envío a Lima y provincias.",
  keywords: [
    "AMYSA SHOP",
    "tienda online Perú",
    "perfumes",
    "maquillaje",
    "cuidado personal",
    "accesorios",
    "Ésika",
    "L'Bel",
    "Cyzone",
    "Yanbal",
    "productos de catálogo",
  ],
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    type: "website",
    siteName: "AMYSA SHOP",
    locale: "es_PE",
    url: "/",
    images: [{ url: "/icons/og-image.png", width: 1200, height: 630, alt: "AMYSA SHOP" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "AMYSA SHOP",
    statusBarStyle: "default",
  },
  other: {
    version: APP_VERSION,
  },
};

export const viewport: Viewport = {
  themeColor: "#AE826D",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const isDigitalRoute = headersList.get("x-amysa-digital") === "1";

  const supabaseOk = isDigitalRoute ? true : await checkSupabase();

  let products: Awaited<ReturnType<typeof getActiveProductsForNav>> = [];
  let categories: Awaited<ReturnType<typeof getRegisteredCategories>> = [];
  let routeScope: RouteScope = "public";

  if (supabaseOk && !isDigitalRoute) {
    [products, categories] = await Promise.all([getActiveProductsForNav(), getRegisteredCategories()]);
    routeScope = normalizeRouteScope(headersList.get("x-amysa-route-scope"));
  }

  return (
    <html lang="es-PE">
      <body className={`${manrope.variable} ${playfair.variable} min-h-screen flex flex-col antialiased`} data-app-version={APP_VERSION}>
        {!supabaseOk ? (
          <MaintenanceScreen />
        ) : (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": ["Organization", "OnlineStore"],
                  "@id": `${getSiteUrl()}/#organization`,
                  name: "AMYSA SHOP",
                  url: getSiteUrl(),
                  logo: `${getSiteUrl()}/icons/icon-512.png`,
                  image: `${getSiteUrl()}/icons/og-image.png`,
                  description:
                    "Tienda online peruana de perfumes, maquillaje, cuidado personal y accesorios de marcas de catálogo (Ésika, L'Bel, Cyzone, Yanbal). Envíos a Lima y provincias; pagos con Yape, Plin y transferencia bancaria.",
                  areaServed: { "@type": "Country", name: "Perú" },
                  currenciesAccepted: "PEN",
                  paymentAccepted: "Yape, Plin, Transferencia bancaria",
                  address: { "@type": "PostalAddress", addressLocality: "Lima", addressCountry: "PE" },
                  contactPoint: [
                    {
                      "@type": "ContactPoint",
                      telephone: "+51 965 312 386",
                      contactType: "customer service",
                      areaServed: "PE",
                      availableLanguage: "es",
                    },
                  ],
                  sameAs: [
                    "https://www.instagram.com/amysa.shop/",
                    "https://www.tiktok.com/@amysa.shop",
                  ],
                }),
              }}
            />
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary">
              Saltar al contenido principal
            </a>
            <DevServiceWorkerCleanup />
            <NotificationProvider>
              {isDigitalRoute ? (
                children
              ) : (
                <LayoutWrapper products={products} categories={categories} routeScope={routeScope}>
                  {children}
                </LayoutWrapper>
              )}
              <AmysaAssistantWidget />
            </NotificationProvider>
          </>
        )}
      </body>
    </html>
  );
}
