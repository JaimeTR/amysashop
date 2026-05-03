"use client";

import { useBrandObjectsFromDB } from "@/lib/use-db-taxonomies";
import { BrandLogo } from "@/components/store/brand-logo";
import { Badge } from "@/components/ui/badge";

export function BrandManagementPanel() {
  const { brands } = useBrandObjectsFromDB();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">Gestión de Marcas</h2>
        <p className="text-sm text-muted-foreground">
          Marcas registradas actualmente en el sistema
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="rounded-lg border border-border bg-card p-6 transition hover:shadow-lg"
          >
            <div className="mb-4 flex justify-center">
              <BrandLogo brandName={brand.name} size="lg" withBackground={false} />
            </div>
            
            <h3 className="mb-2 text-center text-lg font-semibold">{brand.name}</h3>

            {brand.color && (
              <div className="mb-4 flex items-center justify-center gap-2">
                <div
                  className="h-6 w-6 rounded border border-border"
                  style={{ backgroundColor: brand.color }}
                />
                <code className="text-xs text-muted-foreground">{brand.color}</code>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline">ID: {brand.id}</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="mb-2 font-semibold">Información</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Total de marcas: <strong>{brands.length}</strong></li>
          <li>• Logos ubicados en: <code className="text-xs">/public/logos/</code></li>
          <li>• Las marcas se usan automáticamente en filtros y tarjetas de productos</li>
        </ul>
      </div>
    </div>
  );
}
