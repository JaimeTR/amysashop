"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, Filter } from "lucide-react";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { BrandLogo } from "@/components/store/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { canonicalizeBrandName, getRegisteredBrandNames } from "@/lib/brands";
import { useRegisteredTaxonomies } from "@/lib/use-registered-taxonomies";
import type { Product } from "@/lib/types";

type Props = {
  products: Product[];
  initialCategory?: string;
  initialBrand?: string;
};

type SortOption = "recent" | "price-asc" | "price-desc" | "name-asc";

type GenderFilter = string;
type AgeFilter = string;

function extractTagValue(description: string, keys: string[]) {
  for (const key of keys) {
    const regex = new RegExp(`\\[${key}:\\s*(.*?)\\]`, "i");
    const match = description.match(regex);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return "";
}

function parsePriceValue(raw: string) {
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/[^0-9,.-]/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function isSafeImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

function getSafeImageSrc(images: string[]) {
  const candidate = (images || []).find(isSafeImageSrc);
  return candidate || "/placeholder-product.svg";
}

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

function normalizeGender(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.startsWith("hom")) return "Hombres";
  if (normalized.startsWith("muj") || normalized.startsWith("fem")) return "Mujeres";
  if (normalized.startsWith("uni")) return "Unisex";
  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) return "Niños";
  return String(value || "").trim();
}

function normalizeAgeGroup(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.startsWith("adult")) return "Adultos";
  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) return "Niños";
  if (normalized.startsWith("beb") || normalized.startsWith("inf")) return "Bebés";
  return String(value || "").trim();
}

export function TiendaClientGrid({ products, initialCategory, initialBrand }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const canonicalInitialBrand = canonicalizeBrandName(initialBrand || "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(canonicalInitialBrand ? [canonicalInitialBrand] : []);
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeFilter>("");
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [packOnly, setPackOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const { genderOptions, ageGroupOptions } = useRegisteredTaxonomies();

  useEffect(() => {
    setSelectedCategories(initialCategory ? [initialCategory] : []);
  }, [initialCategory]);

  useEffect(() => {
    const nextBrand = canonicalizeBrandName(initialBrand || "");
    setSelectedBrands(nextBrand ? [nextBrand] : []);
  }, [initialBrand]);

  const productMetaById = useMemo(() => {
    const map = new Map<
      string,
      {
        brand: string;
        ageGroup: string;
        isPack: boolean;
        hasDiscount: boolean;
        oldPriceValue: number | null;
        marketingLabel: string;
      }
    >();

    for (const product of products) {
      const description = String(product.description || "");
      // Prioriza el campo brand del producto, si no existe extrae de las etiquetas
      const brand = canonicalizeBrandName(String(product.brand || "").trim() || extractTagValue(description, ["Marca"]));
      const ageGroup = String(product.ageGroup || "").trim() || extractTagValue(description, ["Edad", "Age", "GrupoEdad", "Grupo de edad"]);
      const isPackTag = extractTagValue(description, ["Pack", "Combo", "is_pack", "IsPack"]).toLowerCase();
      const isPackByTag = ["1", "true", "si", "sí", "pack", "combo", "combo amysa"].includes(isPackTag);
      const categoryLower = String(product.category || "").toLowerCase();
      const nameLower = String(product.name || "").toLowerCase();
      const isPack =
        isPackByTag ||
        categoryLower.includes("combo") ||
        categoryLower.includes("pack") ||
        categoryLower.includes("amysa") ||
        nameLower.includes("combo") ||
        nameLower.includes("pack");

      const oldPriceFromTags = parsePriceValue(
        extractTagValue(description, ["PrecioAntes", "Precio Anterior", "PVP", "PrecioLista", "Precio Lista"])
      );
      const oldPriceValue = (product.priceBefore && product.priceBefore > 0 ? product.priceBefore : null) ?? oldPriceFromTags;
      const hasDiscount = Boolean(oldPriceValue && oldPriceValue > product.price);
      const marketingLabelRaw = extractTagValue(description, [
        "Etiqueta",
        "Tag",
        "Badge",
        "Sello",
        "Label",
        "Campana",
        "Campaña",
      ]);
      const marketingLabel = marketingLabelRaw || (hasDiscount ? "Oferta" : "");

      map.set(product.id, {
        brand,
        ageGroup,
        isPack,
        hasDiscount,
        oldPriceValue,
        marketingLabel,
      });
    }

    return map;
  }, [products]);

  const brands = useMemo(() => {
    return getRegisteredBrandNames();
  }, []);

  // No usamos submarcas ni subcategorías en la tienda cliente: solo marca y categoría

  const genderProductCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const g = normalizeGender(String(product.gender || ""));
      if (!g) continue;
      const key = normalizeLabel(g);
      const count = map.get(key) || 0;
      map.set(key, count + 1);
    }
    return map;
  }, [products]);


  const categories = useMemo(() => {
    return uniqueLabels(products.map((item) => item.category).filter(Boolean));
  }, [products]);

  // Calcular precio máximo basado en todos los productos
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 100;
    const max = Math.max(...products.map((p) => p.price));
    return Math.ceil(max * 1.1); // Agregar 10% de margen
  }, [products]);

  // Contadores: cuántos productos hay en cada filtro
  const categoryProductCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const key = normalizeLabel(product.category);
      const count = map.get(key) || 0;
      map.set(key, count + 1);
    }
    return map;
  }, [products]);

  const brandProductCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const meta = productMetaById.get(product.id);
      if (meta?.brand) {
        const key = normalizeLabel(meta.brand);
        const count = map.get(key) || 0;
        map.set(key, count + 1);
      }
    }
    return map;
  }, [products, productMetaById]);

  // No hay contadores para submarcas/subcategorías

  const brandOptions = useMemo(() => brands, [brands]);
  const normalizedGenderOptions: GenderFilter[] = useMemo(() => genderOptions, [genderOptions]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedGender = normalizeGender(selectedGender);
    const normalizedAgeGroup = normalizeAgeGroup(selectedAgeGroup);
    const selectedCategoryKeys = selectedCategories.map(normalizeLabel);
    const selectedBrandKeys = selectedBrands.map(normalizeLabel);

    let list = products.filter((item) => {
      const itemCategoryKey = normalizeLabel(item.category);
      const matchesCategory = selectedCategoryKeys.length === 0 || selectedCategoryKeys.includes(itemCategoryKey);
      const meta = productMetaById.get(item.id) || {
        brand: "",
        ageGroup: "",
        isPack: false,
        hasDiscount: false,
        oldPriceValue: null,
        marketingLabel: "",
      };

      const matchesGender = !normalizedGender || normalizeGender(String(item.gender || "")) === normalizedGender;
      const matchesAgeGroup =
        !normalizedAgeGroup || normalizeAgeGroup(String(item.ageGroup || meta.ageGroup || "")) === normalizedAgeGroup;
      const matchesBrandInitial = !canonicalInitialBrand || normalizeLabel(meta.brand) === normalizeLabel(canonicalInitialBrand);
      const matchesBrand = selectedBrandKeys.length === 0 || selectedBrandKeys.includes(normalizeLabel(meta.brand));
      // No usamos submarcas ni subcategorías

      const min = priceMin ? Number(priceMin) : null;
      const max = priceMax ? Number(priceMax) : null;
      const matchesPriceMin = min == null || item.price >= min;
      const matchesPriceMax = max == null || item.price <= max;
      const matchesDiscount = !discountOnly || meta.hasDiscount;
      const matchesPack =
        !packOnly ||
        normalizeLabel(item.category) === normalizeLabel("PACKS AMYSA") ||
        meta.isPack;

      const passesStructuredFilters =
        matchesCategory &&
        matchesBrandInitial &&
        matchesBrand &&
        matchesGender &&
        matchesAgeGroup &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesDiscount &&
        matchesPack;

      if (!normalizedQuery) {
        return passesStructuredFilters;
      }

      const haystack = [
        item.name,
        item.description,
        item.category,
        meta.brand,
        `s/${item.price.toFixed(2)}`,
      ]
        .join(" ")
        .toLowerCase();

      return passesStructuredFilters && haystack.includes(normalizedQuery);
    });

    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
    }

    return list;
  }, [
    products,
    query,
    selectedCategories,
    selectedBrands,
    priceMin,
    priceMax,
    discountOnly,
    packOnly,
    sortBy,
    canonicalInitialBrand,
    selectedGender,
    selectedAgeGroup,
    productMetaById,
  ]);

  function toggleSelection(value: string, setState: Dispatch<SetStateAction<string[]>>) {
    setState((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      return [...current, value];
    });
  }

  function toggleCategory(category: string) {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }
      return [...current, category];
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="glass-card h-fit rounded-3xl p-5">
        <h2 className="text-2xl font-semibold">Filtros</h2>
        <p className="mt-1 text-sm text-muted-foreground">Refina por categoría y encuentra más rápido.</p>

        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold">Categorías</p>
          {categories.map((category) => {
            const checked = selectedCategories.includes(category);
            const count = categoryProductCount.get(normalizeLabel(category)) || 0;
            return (
              <label key={category} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(category)}
                    className="size-4 rounded border-input"
                  />
                  <span>{category}</span>
                </span>
                <span className="text-xs text-muted-foreground">({count})</span>
              </label>
            );
          })}
        </div>

        {/* Subcategorías: removidas del UI - usamos solo categoría principal */}

        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold">Marcas</p>
          {brands.length === 0 ? <p className="text-xs text-muted-foreground">Sin marcas detectadas.</p> : null}
          <div className="grid grid-cols-2 gap-2">
            {brands.map((brand) => {
              const checked = selectedBrands.includes(brand);
              const count = brandProductCount.get(normalizeLabel(brand)) || 0;
              return (
                <label
                  key={brand}
                  className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all ${
                    checked ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelection(brand, setSelectedBrands)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <div className="pointer-events-none flex flex-col items-center gap-1">
                    <BrandLogo brandName={brand} size="sm" withBackground={false} />
                    <span className="text-center text-xs font-semibold">{brand}</span>
                    <span className="text-xs text-muted-foreground">({count})</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submarcas: removidas del UI - usamos solo marca principal */}

        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold">Género</p>
          {normalizedGenderOptions.length === 0 ? <p className="text-xs text-muted-foreground">Sin géneros detectados.</p> : null}
          <label className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="gender"
                checked={selectedGender === ""}
                onChange={() => setSelectedGender("")}
                className="size-4 rounded border-input"
              />
              <span>Todos</span>
            </span>
            <span className="text-xs text-muted-foreground">({products.length})</span>
          </label>
          {normalizedGenderOptions.map((g) => {
            const checked = selectedGender === g;
            const count = genderProductCount.get(normalizeLabel(g)) || 0;
            return (
              <label key={g} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    checked={checked}
                    onChange={() => setSelectedGender(g)}
                    className="size-4 rounded border-input"
                  />
                  <span>{g}</span>
                </span>
                <span className="text-xs text-muted-foreground">({count})</span>
              </label>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold">Rango de precio</p>
          <div className="space-y-3 rounded-lg border border-[#e3d7cd] bg-white/50 p-3">
            {/* Sliders para rango de precio */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Mínimo: S/ {priceMin || "0"}
              </label>
              <input
                type="range"
                min="0"
                max={maxPrice}
                step="1"
                value={priceMin || 0}
                onChange={(event) => {
                  const value = event.target.value;
                  const numValue = Number(value);
                  const maxValue = Number(priceMax || maxPrice);
                  if (numValue <= maxValue) {
                    setPriceMin(value);
                  }
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-primary/30 to-primary/10 accent-primary"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((Number(priceMin || 0) / maxPrice) * 100).toFixed(0)}%, #e3d7cd ${((Number(priceMin || 0) / maxPrice) * 100).toFixed(0)}%, #e3d7cd 100%)`,
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Máximo: S/ {priceMax || maxPrice}
              </label>
              <input
                type="range"
                min="0"
                max={maxPrice}
                step="1"
                value={priceMax || maxPrice}
                onChange={(event) => {
                  const value = event.target.value;
                  const numValue = Number(value);
                  const minValue = Number(priceMin || 0);
                  if (numValue >= minValue) {
                    setPriceMax(value);
                  }
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-primary/30 to-primary/10 accent-primary"
                style={{
                  background: `linear-gradient(to right, #e3d7cd 0%, #e3d7cd ${((Number(priceMax || maxPrice) / maxPrice) * 100).toFixed(0)}%, var(--primary) ${((Number(priceMax || maxPrice) / maxPrice) * 100).toFixed(0)}%, var(--primary) 100%)`,
                }}
              />
            </div>

            {/* Display del rango */}
            <div className="rounded-md bg-primary/5 px-2 py-1.5 text-center text-xs font-semibold text-primary">
              S/ {priceMin || 0} - S/ {priceMax || maxPrice}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={discountOnly}
              onChange={(event) => setDiscountOnly(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Solo con descuento
          </label>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={packOnly}
              onChange={(event) => setPackOnly(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Pack / Combo AMYSA
          </label>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="glass-card rounded-2xl p-3">
          <div className="relative">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-10 shrink-0 rounded-xl p-0"
                onClick={() => setShowQuickFilters((current) => !current)}
                aria-label="Abrir filtros"
              >
                <Filter className="size-4" />
              </Button>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar producto"
                  className="h-10 w-full rounded-xl border border-input bg-white/80 pl-10 pr-3 text-sm outline-none focus:border-primary/40"
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
                      onChange={(event) => setSelectedGender(event.target.value as GenderFilter)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    >
                      <option value="">Todos</option>
                      {normalizedGenderOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Edad
                    <select
                      value={selectedAgeGroup}
                      onChange={(event) => setSelectedAgeGroup(event.target.value as AgeFilter)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    >
                      <option value="">Todas</option>
                      {ageGroupOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Categoría
                    <select
                      value={selectedCategories[0] || ""}
                      onChange={(event) => setSelectedCategories(event.target.value ? [event.target.value] : [])}
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
                      value={selectedBrands[0] || ""}
                      onChange={(event) => setSelectedBrands(event.target.value ? [event.target.value] : [])}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    >
                      <option value="">Todas</option>
                      {brandOptions.map((option) => (
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
                        setSelectedAgeGroup("");
                        setSelectedCategories([]);
                        setSelectedBrands([]);
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

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {filteredProducts.length} producto{filteredProducts.length === 1 ? "" : "s"}
            </p>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-10 rounded-xl border border-input bg-white/80 px-3 text-sm outline-none focus:border-primary/40"
            >
              <option value="recent">Ordenar: recientes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre: A-Z</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="glass-card overflow-hidden transition hover:scale-[1.01]">
              <div className="relative">
                <Link href={`/producto/${product.id}`}>
                  <Image
                    src={getSafeImageSrc(product.images)}
                    alt={product.name}
                    width={800}
                    height={800}
                    unoptimized
                    className="h-40 w-full object-cover"
                  />
                </Link>
                {(() => {
                  const meta = productMetaById.get(product.id);
                  return meta?.brand ? (
                    <div className="absolute right-2 top-2 rounded-lg bg-white/80 p-1.5 shadow-md backdrop-blur">
                      <BrandLogo brandName={meta.brand} size="sm" withBackground={false} />
                    </div>
                  ) : null;
                })()}
              </div>
              <CardContent className="space-y-2 p-3">
                {(() => {
                  const meta = productMetaById.get(product.id);
                  const oldPriceValue = meta?.oldPriceValue ?? null;
                  const marketingLabel = String(meta?.marketingLabel || "").trim();
                  const hasDiscount = Boolean(oldPriceValue && oldPriceValue > product.price);
                  const discountPercent = hasDiscount ? Math.round(((oldPriceValue! - product.price) / oldPriceValue!) * 100) : 0;

                  return (
                    <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
                  {marketingLabel ? <Badge className="bg-primary/10 text-primary">{marketingLabel}</Badge> : null}
                </div>
                <Link href={`/producto/${product.id}`} className="block">
                  <h2 className="line-clamp-2 font-semibold text-foreground hover:text-primary">{product.name}</h2>
                </Link>
                <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                <div className="space-y-0.5">
                  {hasDiscount ? (
                    <p className="text-xs text-muted-foreground line-through">S/ {Number(oldPriceValue).toFixed(2)}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-primary">S/ {product.price.toFixed(2)}</p>
                    {hasDiscount ? <Badge className="border border-emerald-300 bg-emerald-100 text-emerald-700">{discountPercent}% OFF</Badge> : null}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <AddToCartButton
                    productId={product.id}
                    name={product.name}
                    price={product.price}
                    priceBefore={oldPriceValue}
                    image={getSafeImageSrc(product.images)}
                    buttonLabel="Agregar"
                  />
                  <ToggleFavoriteButton
                    productId={product.id}
                    name={product.name}
                    price={product.price}
                    image={getSafeImageSrc(product.images)}
                    category={product.category}
                  />
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={`/producto/${product.id}`}>
                    Ver producto <ShoppingBag className="ml-2 size-4" />
                  </Link>
                </Button>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
