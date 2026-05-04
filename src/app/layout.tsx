import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { DevServiceWorkerCleanup } from "@/components/pwa/dev-service-worker-cleanup";
import { NotificationProvider } from "@/components/feedback/notification-center";
import { getActiveProductsForNav, getRegisteredCategories } from "@/lib/catalog";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

const APP_VERSION = "0.1.1";
const APP_ICON = "/icon.svg";
const APP_APPLE_ICON = "/logos/amysa-square-primary.png";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  applicationName: "AMYSA SHOP",
  title: "AMYSA SHOP",
  description: "AMYSA SHOP, tu tienda virtual",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: APP_ICON, type: "image/svg+xml" },
      { url: "/logos/amysa-square-primary.png", sizes: "512x512", type: "image/png" },
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
  const [products, categories] = await Promise.all([getActiveProductsForNav(), getRegisteredCategories()]);

  return (
    <html lang="es">
      <body className={`${manrope.variable} ${playfair.variable} min-h-screen flex flex-col antialiased`}>
        <DevServiceWorkerCleanup />
        <NotificationProvider>
          <LayoutWrapper products={products} categories={categories}>
            {children}
          </LayoutWrapper>
        </NotificationProvider>
      </body>
    </html>
  );
}
