"use client";

import Image from "next/image";
import { getBrandByName } from "@/lib/brands";
import type { CSSProperties } from "react";

type BrandLogoProps = {
  brandName: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  withBackground?: boolean;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  imageClassName?: string;
};

const sizeMap = {
  sm: { container: "size-12", text: "text-xs" },
  md: { container: "size-16", text: "text-sm" },
  lg: { container: "size-24", text: "text-base" },
};

export function BrandLogo({ 
  brandName, 
  size = "md", 
  showName = false,
  withBackground = true,
  containerClassName = "",
  containerStyle,
  imageClassName = ""
}: BrandLogoProps) {
  const brand = getBrandByName(brandName);

  if (!brand) {
    return (
      <div className={`${sizeMap[size].container} flex items-center justify-center rounded-lg bg-muted`}>
        <span className={`${sizeMap[size].text} font-semibold text-muted-foreground`}>
          {String(brandName || "").substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  // Para AMYSA SHOP con logos que ya tienen fondo
  const bgClass = withBackground && !brand.name.includes("AMYSA") 
    ? "bg-white" 
    : "bg-transparent";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizeMap[size].container} relative flex items-center justify-center ${bgClass} shadow-sm ${containerClassName}`}
        style={containerStyle}
      >
        <Image
          src={brand.logo}
          alt={brand.name}
          width={96}
          height={96}
          className={`h-full w-full object-contain rounded-[10px] ${imageClassName}`}
          unoptimized
        />
      </div>
      {showName && <span className={`${sizeMap[size].text} font-semibold`}>{brand.name}</span>}
    </div>
  );
}
