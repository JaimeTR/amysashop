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
const APP_ICON = "/icon.svg";
const APP_APPLE_ICON = "/icon.svg";

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
  description: "AMYSA SHOP: tienda online de perfumes, maquillaje, cuidado personal, accesorios y marcas seleccionadas.",
  keywords: ["AMYSA SHOP", "tienda online", "perfumes", "maquillaje", "cuidado personal", "accesorios", "marcas de belleza", "catálogo"],
  metadataBase: new URL(getSiteUrl()),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: APP_ICON, type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: APP_APPLE_ICON, sizes: "180x180", type: "image/png" }],
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
  const isDigitalRoute = headersList.get("x-amysa-digital") === "1" || process.env.NODE_ENV === "development";

  const supabaseOk = isDigitalRoute ? true : await checkSupabase();

  let products: Awaited<ReturnType<typeof getActiveProductsForNav>> = [];
  let categories: Awaited<ReturnType<typeof getRegisteredCategories>> = [];
  let routeScope: RouteScope = "public";

  if (supabaseOk && !isDigitalRoute) {
    [products, categories] = await Promise.all([getActiveProductsForNav(), getRegisteredCategories()]);
    routeScope = normalizeRouteScope(headersList.get("x-amysa-route-scope"));
  }

  return (
    <html lang="es">
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
                  "@type": "Organization",
                  name: "AMYSA SHOP",
                  url: getSiteUrl(),
                  logo: `${getSiteUrl()}/logos/amysa%20shop.png`,
                  description: "Tienda online de perfumes, maquillaje, cuidado personal, accesorios y marcas seleccionadas.",
                  contactPoint: [
                    { "@type": "ContactPoint", telephone: "+51 965 312 386", contactType: "customer service", areaServed: "PE" },
                  ],
                  sameAs: [
                    "https://www.instagram.com/amysa.shop/",
                    "http://tiktok.com/@amysa.shop",
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
