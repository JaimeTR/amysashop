"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/store/brand-logo";
import { useBrandObjectsFromDB } from "@/lib/use-db-taxonomies";
import { Button } from "@/components/ui/button";

type BrandSelectorProps = {
  value?: string;
  onChange: (brandName: string) => void;
  label?: string;
};

export function BrandSelector({ value, onChange, label = "Marca" }: BrandSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { brands } = useBrandObjectsFromDB();

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>
      
      {/* Selected Brand */}
      <div className="rounded-lg border border-input bg-background p-3">
        {value ? (
          <div className="flex items-center gap-3">
            <div className="w-12">
              <BrandLogo brandName={value} size="sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{value}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
            >
              Limpiar
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Selecciona una marca...</p>
        )}
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {brands.map((brand) => (
          <button
            key={brand.id}
            type="button"
            onClick={() => {
              onChange(brand.name);
              setIsOpen(false);
            }}
            className={`rounded-lg border-2 p-2 transition-all ${
              value === brand.name
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <BrandLogo brandName={brand.name} size="sm" withBackground={false} />
              <span className="text-center text-xs font-semibold">{brand.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
