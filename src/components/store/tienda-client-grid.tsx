"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, Filter } from "lucide-react";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ToggleFavoriteButton } from "@/components/product/toggle-favorite-button";
import { BrandLogo } from "@/components/store/brand-logo";
import DiscountSlider from "@/components/store/discount-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { canonicalizeBrandName, getRegisteredBrandNames } from "@/lib/brands";
import { getSafeProductImageSrc } from "@/lib/product-images";
import { useRegisteredTaxonomies } from "@/lib/use-registered-taxonomies";
import { useHierarchicalTaxonomies } from "@/lib/use-hierarchical-taxonomies";
import { useBrandNamesFromDB } from "@/lib/use-db-taxonomies";
import type { Product } from "@/lib/types";

type Props = {
  products: Product[];
  allProducts?: Product[]; // Todos los productos (para contar géneros, marcas, etc)
  categories?: string[];
  initialCategory?: string;
  initialBrand?: string;
  showFeatured?: boolean;
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

function getSafeImageSrc(images: string[]) {
  return getSafeProductImageSrc(images);
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
  if (normalized.startsWith("hom") || normalized.startsWith("masc") || normalized === "male" || normalized === "man") return "Hombre";
  if (normalized.startsWith("muj") || normalized.startsWith("fem") || normalized === "female" || normalized === "woman") return "Mujer";
  if (normalized.startsWith("uni")) return "Unisex";
  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) return "Unisex";
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

function navigateToProduct(productId: string) {
  window.location.href = `/producto/${productId}`;
}

export function TiendaClientGrid({ products, allProducts, categories = [], initialCategory, initialBrand, showFeatured = false }: Props) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const canonicalInitialBrand = canonicalizeBrandName(initialBrand || "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(canonicalInitialBrand ? [canonicalInitialBrand] : []);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedSubbrands, setSelectedSubbrands] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeFilter>("");
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [packOnly, setPackOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const { genderOptions, ageGroupOptions } = useRegisteredTaxonomies();
  const { subcategories, subbrands, loadSubcategoriesForCategory, loadSubbrandsForBrand } = useHierarchicalTaxonomies();
  const { brandNames: brandsFromDB } = useBrandNamesFromDB();

  // Activar filtro de descuentos si viene del parámetro URL
  useEffect(() => {
    if (searchParams?.get("descuento") === "true") {
      setDiscountOnly(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setSelectedCategories(initialCategory ? [initialCategory] : []);
    // Limpiar subcategorías cuando cambia categoría inicial
    setSelectedSubcategories([]);
  }, [initialCategory]);

  useEffect(() => {
    const nextBrand = canonicalizeBrandName(initialBrand || "");
    setSelectedBrands(nextBrand ? [nextBrand] : []);
    // Limpiar submarcas cuando cambia marca inicial
    setSelectedSubbrands([]);
  }, [initialBrand]);

  // Cargar subcategorías cuando se selecciona una categoría
  useEffect(() => {
    if (selectedCategories.length === 1) {
      loadSubcategoriesForCategory(selectedCategories[0]);
    } else {
      setSelectedSubcategories([]);
    }
  }, [selectedCategories, loadSubcategoriesForCategory]);

  // Cargar submarcas cuando se selecciona una marca
  useEffect(() => {
    if (selectedBrands.length === 1) {
      loadSubbrandsForBrand(selectedBrands[0]);
    } else {
      setSelectedSubbrands([]);
    }
  }, [selectedBrands, loadSubbrandsForBrand]);

  const productsForMeta = useMemo(
    () => ((allProducts && allProducts.length > 0 ? allProducts : products) || []),
    [products, allProducts]
  );

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

    for (const product of productsForMeta) {
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
  }, [productsForMeta]);

  const brands = useMemo(() => {
    const fromProducts = uniqueLabels(
      productsForMeta
        .map((product) => {
          const directBrand = canonicalizeBrandName(String(product.brand || "").trim());
          if (directBrand) return directBrand;
          const meta = productMetaById.get(product.id);
          return canonicalizeBrandName(String(meta?.brand || "").trim());
        })
        .filter(Boolean)
    );

    const merged = uniqueLabels([
      ...brandsFromDB,
      ...fromProducts,
      ...getRegisteredBrandNames(),
    ]);

    return merged;
  }, [brandsFromDB, productMetaById, productsForMeta]);

  // No usamos submarcas ni subcategorías en la tienda cliente: solo marca y categoría

  const genderProductCount = useMemo(() => {
    const map = new Map<string, number>();
    const productsToCount = allProducts && allProducts.length > 0 ? allProducts : products;
    for (const product of productsToCount) {
      const g = normalizeGender(String(product.gender || ""));
      if (!g) continue;
      const key = normalizeLabel(g);
      const count = map.get(key) || 0;
      map.set(key, count + 1);
    }
    return map;
  }, [products, allProducts]);


  const availableCategories = useMemo(
    () => (categories.length > 0 ? categories : uniqueLabels((allProducts && allProducts.length > 0 ? allProducts : products).map((item) => item.category).filter(Boolean))),
    [categories, products, allProducts]
  );

  // Calcular precio máximo basado en todos los productos
  const maxPrice = useMemo(() => {
    const productsToCount = allProducts && allProducts.length > 0 ? allProducts : products;
    if (productsToCount.length === 0) return 100;
    const max = Math.max(...productsToCount.map((p) => p.price));
    return Math.ceil(max * 1.1); // Agregar 10% de margen
  }, [products, allProducts]);

  // Contadores: cuántos productos hay en cada filtro
  const categoryProductCount = useMemo(() => {
    const map = new Map<string, number>();
    const productsToCount = allProducts && allProducts.length > 0 ? allProducts : products;
    for (const product of productsToCount) {
      const key = normalizeLabel(product.category);
      const count = map.get(key) || 0;
      map.set(key, count + 1);
    }
    return map;
  }, [products, allProducts]);

  const brandProductCount = useMemo(() => {
    const map = new Map<string, number>();
    const productsToCount = allProducts && allProducts.length > 0 ? allProducts : products;
    for (const product of productsToCount) {
      const meta = productMetaById.get(product.id);
      if (meta?.brand) {
        const key = normalizeLabel(meta.brand);
        const count = map.get(key) || 0;
        map.set(key, count + 1);
      }
    }
    return map;
  }, [products, allProducts, productMetaById]);

  // No hay contadores para submarcas/subcategorías

  const brandOptions = useMemo(() => brands, [brands]);
  const normalizedGenderOptions: GenderFilter[] = useMemo(() => genderOptions, [genderOptions]);

  // Contadores para subcategorías y submarcas
  const subcategoryProductCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      // Este campo podría estar en product o extraerse de los metadatos
      if (selectedCategories.length === 1) {
        // Solo contar subcategorías que pertenecen a la categoría seleccionada
        map.set(selectedCategories[0], (map.get(selectedCategories[0]) || 0) + 1);
      }
    }
    return map;
  }, [products, selectedCategories]);

  const subbrandProductCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      if (selectedBrands.length === 1) {
        map.set(selectedBrands[0], (map.get(selectedBrands[0]) || 0) + 1);
      }
    }
    return map;
  }, [products, selectedBrands]);

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
      
      // Verificar subcategorías: si hay subcategorías seleccionadas, el producto debe pertenecer a una de ellas
      // (o podría estar mapeado directamente en el producto si existe un campo sub_category)
      const matchesSubcategory = selectedSubcategories.length === 0 || 
        selectedSubcategories.includes(String(item.category || "").trim());
      
      // Verificar submarcas: si hay submarcas seleccionadas, el producto debe pertenecer a una de ellas
      const matchesSubbrand = selectedSubbrands.length === 0 || 
        selectedSubbrands.includes(meta.brand);

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
        matchesSubcategory &&
        matchesSubbrand &&
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
    selectedSubcategories,
    selectedSubbrands,
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

  // Limitar productos cuando showFeatured es true
  const displayedProducts = useMemo(() => {
    if (showFeatured) {
      return filteredProducts.slice(0, 12);
    }
    return filteredProducts;
  }, [filteredProducts, showFeatured]);

  const discountedProducts = useMemo(() => {
    const list = [] as any[];
    for (const p of products) {
      const meta = productMetaById.get(p.id);
      if (meta?.hasDiscount) {
        list.push({
          id: p.id,
          name: p.name,
          images: p.images,
          price: p.price,
          priceBefore: meta?.oldPriceValue ?? null,
          category: p.category,
        });
      }
    }
    return list;
  }, [products, productMetaById]);

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

  const filtersContent = (
    <>
      <h2 className="text-2xl font-semibold">Filtros</h2>
      <p className="mt-1 text-sm text-muted-foreground">Refina por categoría y encuentra más rápido.</p>

      <div className="mt-5 space-y-3">
        <p className="text-sm font-semibold">Categorías</p>
        {availableCategories.map((category) => {
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

      {/* Subcategorías: mostrar cuando una categoría está seleccionada */}
      {subcategories.length > 0 && selectedCategories.length === 1 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold">Subcategorías</p>
          <div className="space-y-2 border-l-2 border-[#e3d7cd] pl-3">
            {subcategories.map((subcat) => {
              const checked = selectedSubcategories.includes(subcat.name);
              return (
                <label key={subcat.id} className="flex items-center justify-between gap-2 text-sm" aria-label={`Seleccionar subcategoría ${subcat.name}`}>
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedSubcategories((current) => {
                          if (current.includes(subcat.name)) {
                            return current.filter((item) => item !== subcat.name);
                          }
                          return [...current, subcat.name];
                        });
                      }}
                      className="size-4 rounded border-input"
                    />
                    <span>{subcat.name}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        <p className="text-sm font-semibold">Marcas</p>
        {brands.length === 0 ? <p className="text-xs text-muted-foreground">Sin marcas detectadas.</p> : null}
        <div className="grid grid-cols-3 gap-2">
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

      {/* Submarcas: mostrar cuando una marca está seleccionada */}
      {subbrands.length > 0 && selectedBrands.length === 1 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold">Submarcas</p>
          <div className="space-y-2 border-l-2 border-[#e3d7cd] pl-3">
            {subbrands.map((subbrand) => {
              const checked = selectedSubbrands.includes(subbrand.name);
              return (
                <label key={subbrand.id} className="flex items-center justify-between gap-2 text-sm" aria-label={`Seleccionar submarca ${subbrand.name}`}>
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedSubbrands((current) => {
                          if (current.includes(subbrand.name)) {
                            return current.filter((item) => item !== subbrand.name);
                          }
                          return [...current, subbrand.name];
                        });
                      }}
                      className="size-4 rounded border-input"
                    />
                    <span>{subbrand.name}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

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
          <span className="text-xs text-muted-foreground">({(allProducts && allProducts.length > 0 ? allProducts : products).length})</span>
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
          {/* Slider dual para rango de precio */}
          <style>{` 
            .price-slider-track {
              position: relative;
              width: 100%;
              height: 0.5rem;
              background: #e3d7cd;
              border-radius: 0.5rem;
              outline: none;
            }
            .price-slider-track input {
              position: absolute;
              width: 100%;
              height: 0.5rem;
              top: 0;
              left: 0;
              margin: 0;
              padding: 0;
              border: none;
              border-radius: 0.5rem;
              background: none;
              pointer-events: none;
              appearance: none;
              -webkit-appearance: none;
            }
            .price-slider-track input::-webkit-slider-thumb {
              appearance: none;
              -webkit-appearance: none;
              width: 1.1rem;
              height: 1.1rem;
              border-radius: 50%;
              background: linear-gradient(135deg, #6b4a38 0%, #4f3526 50%, #3d281a 100%);
              cursor: pointer;
              pointer-events: auto;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(255, 255, 255, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.4);
              border: 2px solid rgba(79, 53, 38, 0.5);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .price-slider-track input::-webkit-slider-thumb:hover {
              transform: scale(1.15);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35), 0 0 0 2px rgba(255, 255, 255, 1), inset 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            .price-slider-track input::-webkit-slider-thumb:active {
              transform: scale(1.2);
            }
            .price-slider-track input::-moz-range-thumb {
              width: 1.1rem;
              height: 1.1rem;
              border-radius: 50%;
              background: linear-gradient(135deg, #6b4a38 0%, #4f3526 50%, #3d281a 100%);
              cursor: pointer;
              pointer-events: auto;
              border: 2px solid rgba(79, 53, 38, 0.5);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(255, 255, 255, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.4);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .price-slider-track input::-moz-range-thumb:hover {
              transform: scale(1.15);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35), 0 0 0 2px rgba(255, 255, 255, 1), inset 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            .price-slider-track input::-moz-range-thumb:active {
              transform: scale(1.2);
            }
            .price-slider-min {
              z-index: 5;
            }
            .price-slider-max {
              z-index: 6;
            }
          `}</style>
          <div className="space-y-2">
            <div className="block text-xs font-medium text-muted-foreground">
              Rango: S/ {priceMin || "0"} - S/ {priceMax || maxPrice}
            </div>
            <div className="price-slider-track">
              <input
                type="range"
                min="0"
                max={maxPrice}
                step="1"
                value={priceMin || 0}
                onChange={(event) => {
                  const newMin = Number(event.target.value);
                  const currentMax = Number(priceMax || maxPrice);
                  if (newMin <= currentMax) {
                    setPriceMin(String(newMin));
                  }
                }}
                className="price-slider-min"
              />
              <input
                type="range"
                min="0"
                max={maxPrice}
                step="1"
                value={priceMax || maxPrice}
                onChange={(event) => {
                  const newMax = Number(event.target.value);
                  const currentMin = Number(priceMin || 0);
                  if (newMax >= currentMin) {
                    setPriceMax(String(newMax));
                  }
                }}
                className="price-slider-max"
              />
            </div>
          </div>

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
    </>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="hidden sticky top-36 h-fit max-h-[calc(100vh-10rem)] overflow-y-auto rounded-3xl p-5 md:block glass-card [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">{filtersContent}</aside>

      <section className="space-y-4">
        <div className="glass-card rounded-2xl p-3">
          <div className="relative">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="order-1 flex w-full items-center justify-between gap-2 md:order-2 md:w-auto md:justify-normal md:flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl px-3 text-sm md:hidden"
                  onClick={() => setShowQuickFilters((current) => !current)}
                >
                  <Filter className="mr-2 size-4" />
                  Filtrar
                </Button>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-white/80 px-3 text-sm outline-none focus:border-primary/40 md:flex-none"
                >
                  <option value="recent">Ordenar: recientes</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="name-asc">Nombre: A-Z</option>
                </select>
              </div>

              <div className="order-2 w-full md:order-1 md:w-auto">
                <div className="relative w-full md:w-[360px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar producto"
                    className="h-10 w-full rounded-xl border border-input bg-white/80 pl-10 pr-3 text-sm outline-none focus:border-primary/40"
                  />
                </div>
              </div>
            </div>

            
          </div>

          {showQuickFilters ? (
            <div className="mt-3 glass-card h-fit rounded-3xl p-5 md:hidden">{filtersContent}</div>
          ) : null}
        </div>

        <div className="grid gap-3 px-3 sm:grid-cols-2 sm:px-0 xl:grid-cols-4">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="glass-card overflow-hidden group cursor-pointer rounded-xl border bg-card text-card-foreground shadow-sm"
              onClick={(e) => {
                const target = e.target as HTMLElement | null;
                const interactive = target?.closest("a,button,[role='button']");
                if (!interactive) {
                  window.location.href = `/producto/${product.id}`;
                }
              }}
            >
              <div className="relative">
                <Link href={`/producto/${product.id}`} onClick={() => navigateToProduct(product.id)}>
                  <Image
                    src={getSafeImageSrc(product.images)}
                    alt={product.name}
                    width={800}
                    height={800}
                    unoptimized
                    className="aspect-square w-full object-cover transition-transform duration-300 transform group-hover:scale-105"
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
                <Link href={`/producto/${product.id}`} className="block" onClick={() => navigateToProduct(product.id)}>
                  <h2 className="line-clamp-1 truncate font-semibold text-foreground hover:text-primary">{product.name}</h2>
                </Link>
                <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                <div className="space-y-0.5">
                  {hasDiscount ? (
                    <p className="text-xs text-muted-foreground line-through">S/ {Number(oldPriceValue).toFixed(2)}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-primary">S/ {product.price.toFixed(2)}</p>
                    {hasDiscount ? <Badge className="border border-success/70 bg-success/90 text-success-foreground">{discountPercent}% OFF</Badge> : null}
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
                  <a
                      href={`/producto/${product.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Forzar navegación clásica en caso de que la SPA no responda
                        window.location.href = `/producto/${product.id}`;
                      }}
                      className="inline-flex items-center"
                    >
                      Ver producto <ShoppingBag className="ml-2 size-4" />
                    </a>
                </Button>
                    </>
                  );
                })()}
              </CardContent>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
