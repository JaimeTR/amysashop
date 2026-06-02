"use client";

import { MainNav } from "@/components/layout/main-nav";
import Footer from "@/components/layout/footer";
interface LayoutWrapperProps {
  products: any[];
  categories: any[];
  children: React.ReactNode;
  routeScope?: "public" | "admin" | "banner";
}

export function LayoutWrapper({ products, categories, children, routeScope = "public" }: LayoutWrapperProps) {
  const isBannerPage = routeScope === "banner";
  const isAdminRoute = routeScope === "admin";

  if (isBannerPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div id="main-content" className="flex-1 mx-auto w-full max-w-[1920px] px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pb-10 lg:px-8 xl:px-10 2xl:px-12">
        {!isAdminRoute ? <MainNav products={products} categories={categories} /> : null}
        {children}
      </div>
      {!isAdminRoute ? <Footer /> : null}
    </>
  );
}
