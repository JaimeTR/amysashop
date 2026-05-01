"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/layout/main-nav";
import Footer from "@/components/layout/footer";

interface LayoutWrapperProps {
  products: any[];
  categories: any[];
  children: React.ReactNode;
}

export function LayoutWrapper({ products, categories, children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isBannerPage = pathname === "/banner";

  if (isBannerPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex-1 mx-auto w-full max-w-[1920px] px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pb-10 lg:px-8 xl:px-10 2xl:px-12">
        <MainNav products={products} categories={categories} />
        {children}
      </div>
      <Footer />
    </>
  );
}
