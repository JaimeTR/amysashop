"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { canonicalizeBrandName, getRegisteredBrandNames } from "@/lib/brands";
import { useBrandNamesFromDB } from "@/lib/use-db-taxonomies";
import { useRegisteredTaxonomies } from "@/lib/use-registered-taxonomies";
import { Product } from "@/lib/types";

type Props = {
  products: Product[];
};

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueLabels(values: string[]) {
  const seen = new Map<string, string>();

  for (const value of values) {
    const label = String(value || "").trim();
    if (!label) continue;

    const key = normalizeLabel(label);
    if (!seen.has(key)) {
      seen.set(key, label);
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
}

export function BuscarClient({ products }: Props) {
  const [query, setQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const { genderOptions } = useRegisteredTaxonomies();
  const { brandNames } = useBrandNamesFromDB();

  const categories = useMemo(() => uniqueLabels(products.map((product) => product.category).filter(Boolean)), [products]);
  const brands = useMemo(() => brandNames, [brandNames]);

  function normalizeGender(value: string) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return "";
    if (normalized.startsWith("hom") || normalized.startsWith("masc") || normalized === "male" || normalized === "man") return "Hombre";
    if (normalized.startsWith("muj") || normalized.startsWith("fem") || normalized === "female" || normalized === "woman") return "Mujer";
    if (normalized.startsWith("uni")) return "Unisex";
    if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) return "Unisex";
    return String(value || "").trim();
  }

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    const normalizedGender = normalizeGender(selectedGender);
    const normalizedCategory = normalizeLabel(selectedCategory || "");
    const normalizedBrand = normalizeLabel(canonicalizeBrandName(selectedBrand || ""));

    return products.filter((product) => {
      const matchesText = !value || product.name.toLowerCase().includes(value);
      const matchesGender = !normalizedGender || normalizeGender(String(product.gender || "")) === normalizedGender;
      const matchesCategory = !normalizedCategory || normalizeLabel(String(product.category || "")) === normalizedCategory;
      const matchesBrand = !normalizedBrand || normalizeLabel(canonicalizeBrandName(String(product.brand || ""))) === normalizedBrand;
      return matchesText && matchesGender && matchesCategory && matchesBrand;
    });
  }, [products, query, selectedGender, selectedCategory, selectedBrand]);

  return (
    <main className="space-y-5 pb-8">
      <h1 className="font-[var(--font-display)] text-3xl">Buscar</h1>
      <div className="relative">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-10 shrink-0 rounded-md p-0"
            onClick={() => setShowQuickFilters((current) => !current)}
            aria-label="Abrir filtros"
          >
            <Filter className="size-4" />
          </Button>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Busca un producto..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {showQuickFilters ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-2xl border border-[#e3d7cd] bg-white p-3 shadow-lg sm:w-[360px]">
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Género
                <select
                  value={selectedGender}
                  onChange={(event) => setSelectedGender(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  <option value="">Todos</option>
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Categoría
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  <option value="">Todas</option>
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Marca
                <select
                  value={selectedBrand}
                  onChange={(event) => setSelectedBrand(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  <option value="">Todas</option>
                  {brands.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-sm"
                  onClick={() => {
                    setSelectedGender("");
                    setSelectedCategory("");
                    setSelectedBrand("");
                  }}
                >
                  Limpiar
                </Button>
                <Button type="button" variant="outline" className="h-8 px-2 text-sm" onClick={() => setShowQuickFilters(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="grid gap-2">
        {filtered.map((product) => (
          <Link
            key={product.id}
            href={`/producto/${product.id}`}
            className="glass-card rounded-xl p-4"
          >
            <p className="font-semibold">{product.name}</p>
            <div className="space-y-0.5">
              {product.priceBefore && product.priceBefore > product.price ? (
                <p className="text-xs text-muted-foreground line-through">S/ {Number(product.priceBefore).toFixed(2)}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">S/ {product.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
