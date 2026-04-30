import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/layout/main-nav";
import { DevServiceWorkerCleanup } from "@/components/pwa/dev-service-worker-cleanup";
import { NotificationProvider } from "@/components/feedback/notification-center";
import { getActiveProductsForNav } from "@/lib/catalog";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "AMYSA SHOP",
  description: "AMYSA SHOP, tu tienda virtual",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logos/amysa-square-primary.png", type: "image/png" },
      { url: "/logos/amysa-square-black.png", type: "image/png" },
    ],
    apple: "/logos/amysa-square-primary.png",
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
  const products = await getActiveProductsForNav();

  return (
    <html lang="es">
      <body className={`${manrope.variable} ${playfair.variable} min-h-screen antialiased`}>
        <DevServiceWorkerCleanup />
        <NotificationProvider>
          <div className="mx-auto w-full max-w-[1920px] px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pb-10 lg:px-8 xl:px-10 2xl:px-12">
            <MainNav products={products} />
            {children}
          </div>
        </NotificationProvider>
      </body>
    </html>
  );
}
