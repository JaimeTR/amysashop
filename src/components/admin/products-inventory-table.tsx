"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Eye, Filter, Pencil, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canonicalizeBrandName } from "@/lib/brands";
import { ProductEditModal } from "@/components/admin/product-edit-modal";
import { ConfirmDeleteModal } from "@/components/feedback/confirm-delete-modal";
import { getSafeProductImageSrc } from "@/lib/product-images";
import { useRegisteredTaxonomies } from "@/lib/use-registered-taxonomies";

type InventoryRow = {
  id: string;
  sku: string;
  name: string;
  gender?: string;
  ageGroup?: string;
  brand: string;
  subBrand?: string;
  category: string;
  subCategory?: string;
  price: number;
  priceBefore: number | null;
  stock: number;
  description: string;
  rawDescription: string;
  images: string[];
  active: boolean;
};

type ProductDetailMeta = {
  shortDescription: string;
  characteristics: string;
  colors: string;
  sizes: string;
};

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

function buildProductDetailMeta(rawDescription: string, fallbackDescription: string): ProductDetailMeta {
  const shortDescription = fallbackDescription.trim() || "Sin descripción";

  return {
    shortDescription,
    characteristics: extractTagValue(rawDescription, ["Características", "Caracteristicas", "Característica", "Caracteristica"]),
    colors: extractTagValue(rawDescription, ["Colores", "Color"]),
    sizes: extractTagValue(rawDescription, ["Tallas", "Tamaños", "Tamanos", "Talla", "Tamaño", "Tamano"]),
  };
}

function getSafeImageSrc(images: string[]) {
  return getSafeProductImageSrc(images);
}

type Props = {
  rows: InventoryRow[];
  categoryOptions: string[];
  brandOptions: string[];
  subBrands: Array<{ name: string; brand: string }>;
  subCategories: Array<{ name: string; category: string }>;
  updateProductAction: (formData: FormData) => Promise<void>;
  cloneProductAction: (formData: FormData) => Promise<void>;
  deleteProductAction: (formData: FormData) => Promise<void>;
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
};

type GenderFilter = "" | "Hombre" | "Mujer" | "Unisex";

function normalizeGender(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.startsWith("hom") || normalized.startsWith("masc") || normalized === "male" || normalized === "man") return "Hombre";
  if (normalized.startsWith("muj") || normalized.startsWith("fem") || normalized === "female" || normalized === "woman") return "Mujer";
  if (normalized.startsWith("uni")) return "Unisex";
  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) return "Unisex";
  return String(value || "").trim();
}

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[00-\u036f]/g, "");
}

type SavedProductFilters = {
  selectedGender: GenderFilter;
  selectedAgeGroup: string;
  selectedCategory: string;
  selectedSubCategory: string;
  selectedBrand: string;
  selectedSubBrand: string;
};

const PRODUCTS_FILTERS_STORAGE_KEY = "admin.products.inventory.filters";

export function ProductsInventoryTable({
  rows,
  categoryOptions,
  brandOptions,
  subBrands,
  subCategories,
  updateProductAction,
  cloneProductAction,
  deleteProductAction,
  currentPage = 1,
  pageSize = 20,
  totalCount,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSubBrand, setSelectedSubBrand] = useState("");
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { genderOptions, ageGroupOptions } = useRegisteredTaxonomies();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const previewProduct = useMemo(() => rows.find((row) => row.id === previewProductId) ?? null, [rows, previewProductId]);
  const previewMeta = useMemo(
    () => (previewProduct ? buildProductDetailMeta(previewProduct.rawDescription || "", previewProduct.description || "") : null),
    [previewProduct]
  );

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(PRODUCTS_FILTERS_STORAGE_KEY);
      if (!rawValue) return;

      const saved = JSON.parse(rawValue) as Partial<SavedProductFilters>;

      if (saved.selectedGender) setSelectedGender(saved.selectedGender);
      if (saved.selectedAgeGroup) setSelectedAgeGroup(saved.selectedAgeGroup);
      if (saved.selectedCategory) setSelectedCategory(saved.selectedCategory);
      if (saved.selectedSubCategory) setSelectedSubCategory(saved.selectedSubCategory);
      if (saved.selectedBrand) setSelectedBrand(saved.selectedBrand);
      if (saved.selectedSubBrand) setSelectedSubBrand(saved.selectedSubBrand);
    } catch {
      // Si el valor guardado está corrupto, se ignora.
    }
  }, []);

  const availableSubCategories = useMemo(() => {
    if (!selectedCategory) return [];

    const selectedKey = normalizeLabel(selectedCategory);
    const seen = new Map<string, string>();

    for (const item of subCategories) {
      const categoryKey = normalizeLabel(item.category);
      const name = String(item.name || "").trim();

      if (!name || categoryKey !== selectedKey) continue;

      const key = normalizeLabel(name);
      if (!seen.has(key)) {
        seen.set(key, name);
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
  }, [selectedCategory, subCategories]);

  const availableSubBrands = useMemo(() => {
    if (!selectedBrand) return [];

    const canonicalBrand = canonicalizeBrandName(selectedBrand) || selectedBrand;
    const selectedKey = normalizeLabel(canonicalBrand);
    const seen = new Map<string, string>();

    for (const item of subBrands) {
      const itemBrand = canonicalizeBrandName(item.brand) || item.brand;
      const brandKey = normalizeLabel(itemBrand);
      const name = String(item.name || "").trim();

      if (!name || brandKey !== selectedKey) continue;

      const key = normalizeLabel(name);
      if (!seen.has(key)) {
        seen.set(key, name);
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
  }, [selectedBrand, subBrands]);

  useEffect(() => {
    if (selectedSubCategory && !availableSubCategories.some((item) => normalizeLabel(item) === normalizeLabel(selectedSubCategory))) {
      setSelectedSubCategory("");
    }
  }, [availableSubCategories, selectedSubCategory]);

  useEffect(() => {
    if (selectedSubBrand && !availableSubBrands.some((item) => normalizeLabel(item) === normalizeLabel(selectedSubBrand))) {
      setSelectedSubBrand("");
    }
  }, [availableSubBrands, selectedSubBrand]);

  const handleSaveFilters = () => {
    const payload: SavedProductFilters = {
      selectedGender,
      selectedAgeGroup,
      selectedCategory,
      selectedSubCategory,
      selectedBrand,
      selectedSubBrand,
    };

    try {
      window.localStorage.setItem(PRODUCTS_FILTERS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Si localStorage no está disponible, el filtrado sigue funcionando en memoria.
    }

    setShowQuickFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedGender("");
    setSelectedAgeGroup("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedBrand("");
    setSelectedSubBrand("");

    try {
      window.localStorage.removeItem(PRODUCTS_FILTERS_STORAGE_KEY);
    } catch {
      // Ignorar si localStorage no está disponible.
    }
  };

  const deleteConfirmProduct = useMemo(() => rows.find((row) => row.id === deleteConfirmId) ?? null, [rows, deleteConfirmId]);
  const normalizedGender = normalizeGender(selectedGender);
  const totalCountLocal = totalCount ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCountLocal / pageSize));
  const baseIndex = (currentPage - 1) * pageSize;

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("productId", deleteConfirmId);
      await deleteProductAction(formData);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error eliminando producto:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const normalizedCategory = normalizeLabel(selectedCategory || "");
    const normalizedSubCategory = normalizeLabel(selectedSubCategory || "");
    const normalizedBrand = normalizeLabel(selectedBrand || "");
    const normalizedSubBrand = normalizeLabel(selectedSubBrand || "");
    const normalizedAgeGroup = normalizeLabel(selectedAgeGroup || "");
    const selectedGenderLabel = normalizeLabel(selectedGender || "");

    return rows.filter((row) => {
      const rowGender = normalizeGender(String(row.gender || ""));
      const rowGenderLabel = normalizeLabel(rowGender);
      const rowAgeGroup = normalizeLabel(String(row.ageGroup || ""));
      const searchable = [
        row.sku,
        row.name,
        row.brand,
        row.subBrand,
        row.category,
        row.subCategory,
        row.gender,
        row.ageGroup,
        String(row.price),
        String(row.stock),
        row.active ? "si" : "no",
      ]
        .join(" ")
        .toLowerCase();

      const matchesText = !term || searchable.includes(term);
      const matchesGender = !selectedGenderLabel || rowGenderLabel === selectedGenderLabel;
      const matchesAgeGroup = !normalizedAgeGroup || rowAgeGroup === normalizedAgeGroup;
      const matchesCategory = !normalizedCategory || normalizeLabel(String(row.category || "")) === normalizedCategory;
      const matchesSubCategory = !normalizedSubCategory || normalizeLabel(String(row.subCategory || "")) === normalizedSubCategory;
      const matchesBrand = !normalizedBrand || normalizeLabel(String(row.brand || "")) === normalizedBrand;
      const matchesSubBrand = !normalizedSubBrand || normalizeLabel(String(row.subBrand || "")) === normalizedSubBrand;

      return matchesText && matchesGender && matchesAgeGroup && matchesCategory && matchesSubCategory && matchesBrand && matchesSubBrand;
    });
  }, [rows, query, selectedCategory, selectedSubCategory, selectedBrand, selectedSubBrand, selectedAgeGroup, selectedGender]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-foreground">Inventario de productos</h3>
        <div className="relative w-full sm:max-w-md">
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
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por SKU, nombre, marca, categoría, precio, stock..."
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {showQuickFilters ? (
            <>
              <div
                className="fixed inset-0 z-20 cursor-default bg-transparent"
                onClick={() => setShowQuickFilters(false)}
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-full rounded-xl border border-[#e3d7cd] bg-white p-3 shadow-lg sm:w-[520px]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Categoría
                    <select
                      value={selectedCategory}
                      onChange={(event) => {
                        setSelectedCategory(event.target.value);
                        setSelectedSubCategory("");
                      }}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    >
                      <option value="">Todas</option>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Subcategoría
                    <select
                      value={selectedSubCategory}
                      onChange={(event) => setSelectedSubCategory(event.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                      disabled={!selectedCategory || availableSubCategories.length === 0}
                    >
                      <option value="">
                        {!selectedCategory
                          ? "Primero categoría"
                          : availableSubCategories.length === 0
                          ? "Sin subcategorías"
                          : "Todas"}
                      </option>
                      {availableSubCategories.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Marca
                    <select
                      value={selectedBrand}
                      onChange={(event) => {
                        setSelectedBrand(event.target.value);
                        setSelectedSubBrand("");
                      }}
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

                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Submarca
                    <select
                      value={selectedSubBrand}
                      onChange={(event) => setSelectedSubBrand(event.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                      disabled={!selectedBrand || availableSubBrands.length === 0}
                    >
                      <option value="">
                        {!selectedBrand
                          ? "Primero marca"
                          : availableSubBrands.length === 0
                          ? "Sin submarcas"
                          : "Todas"}
                      </option>
                      {availableSubBrands.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Género
                    <select
                      value={selectedGender}
                      onChange={(event) => setSelectedGender(event.target.value as GenderFilter)}
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
                    Edad
                    <select
                      value={selectedAgeGroup}
                      onChange={(event) => setSelectedAgeGroup(event.target.value)}
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
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2 text-sm"
                    onClick={handleClearFilters}
                  >
                    Limpiar
                  </Button>
                  <Button type="button" className="h-8 px-2 text-sm" onClick={handleSaveFilters}>
                    Guardar filtro
                  </Button>
                  <Button type="button" variant="outline" className="h-8 px-2 text-sm" onClick={() => setShowQuickFilters(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filteredRows.length} de {totalCountLocal} productos
      </p>

      {filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron productos con ese criterio.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white/80">
          <table className="min-w-[1240px] w-full text-sm">
            <thead className="bg-[#efe3d8] text-left">
              <tr>
                <th className="px-3 py-2">N°</th>
                <th className="px-3 py-2">Imagen</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Marca</th>
                <th className="px-3 py-2">Género</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Visible Cliente</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id} className="border-t align-top">
                  <td className="px-3 py-2 text-muted-foreground">{baseIndex + index + 1}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setPreviewProductId(row.id)}
                      className="overflow-hidden rounded-lg border border-[#e3d7cd] bg-white transition hover:opacity-90"
                      aria-label={`Visualizar ${row.name}`}
                    >
                      <Image
                        src={getSafeImageSrc(row.images)}
                        alt={row.name}
                        width={52}
                        height={52}
                        className="h-[52px] w-[52px] object-cover"
                      />
                    </button>
                  </td>
                  <td className="px-3 py-2 font-semibold text-primary">{row.sku || "Sin SKU"}</td>
                  <td className="px-3 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => setPreviewProductId(row.id)}
                      className="text-left text-foreground transition hover:text-primary"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="px-3 py-2">{row.category || "Sin categoría"}</td>
                  <td className="px-3 py-2">{row.brand || "Sin marca"}</td>
                  <td className="px-3 py-2">{row.gender || "-"}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-0.5">
                      {row.priceBefore && row.priceBefore > row.price ? (
                        <p className="text-xs font-medium text-muted-foreground line-through">S/ {Number(row.priceBefore).toFixed(2)}</p>
                      ) : null}
                      <p className="font-semibold text-primary">S/ {Number(row.price).toFixed(2)}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2">{row.stock}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        row.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {row.active ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => setPreviewProductId(row.id)}
                        aria-label="Visualizar"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <ProductEditModal
                        productId={row.id}
                        name={row.name}
                        code={row.sku}
                        gender={row.gender || ""}
                        ageGroup={row.ageGroup || ""}
                        category={row.category}
                        subCategory={row.subCategory || ""}
                        categories={categoryOptions}
                        brand={row.brand}
                        subBrand={row.subBrand || ""}
                        brands={brandOptions}
                        subBrands={subBrands}
                        subCategories={subCategories}
                        price={row.price}
                        priceBefore={row.priceBefore}
                        stock={row.stock}
                        description={row.description}
                        images={row.images}
                        active={row.active}
                        updateProductAction={updateProductAction}
                        triggerMode="icon"
                        triggerIcon={<Pencil className="size-4" />}
                        triggerAriaLabel="Editar"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => setDeleteConfirmId(row.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.assign(`/admin/productos?page=${Math.max(1, currentPage - 1)}`)}
          disabled={currentPage <= 1}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {currentPage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.assign(`/admin/productos?page=${Math.min(totalPages, currentPage + 1)}`)}
          disabled={currentPage >= totalPages}
        >
          Siguiente
        </Button>
      </div>

      {previewProduct && previewMeta && mounted
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/30 bg-[#fcf8f5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3d7cd] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Vista de producto</p>
                <h3 className="font-[var(--font-display)] text-2xl text-foreground">{previewProduct.name}</h3>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewProductId(null)} aria-label="Cerrar vista">
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-2">
                <div className="overflow-hidden rounded-2xl border border-[#e3d7cd] bg-white">
                  <Image
                    src={getSafeImageSrc(previewProduct.images)}
                    alt={previewProduct.name}
                    width={420}
                    height={420}
                    className="h-[260px] w-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-[var(--font-display)] text-2xl text-foreground">{previewProduct.name}</h4>

                <div className="flex flex-wrap gap-2">
                  {previewProduct.category ? (
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {previewProduct.category}
                    </span>
                  ) : null}
                  {previewProduct.brand ? (
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {previewProduct.brand}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1">
                  {previewProduct.priceBefore && previewProduct.priceBefore > previewProduct.price ? (
                    <p className="text-sm font-medium text-muted-foreground line-through">S/ {Number(previewProduct.priceBefore).toFixed(2)}</p>
                  ) : null}
                  <p className="text-2xl font-bold text-primary">S/ {Number(previewProduct.price).toFixed(2)}</p>
                </div>

                <p className="text-sm text-foreground">{previewMeta.shortDescription}</p>

                <div className="grid gap-2 rounded-2xl border border-[#e3d7cd] bg-white/80 p-3 text-sm">
                  <p>
                    <span className="font-semibold">Subcategoría:</span> {previewProduct.subCategory || "-"}
                  </p>

                  <p>
                    <span className="font-semibold">Submarca:</span> {previewProduct.subBrand || "-"}
                  </p>

                  <p>
                    <span className="font-semibold">Género:</span> {previewProduct.gender || "-"}
                  </p>

                  <p>
                    <span className="font-semibold">Edad:</span> {previewProduct.ageGroup || "-"}
                  </p>

                  <p>
                    <span className="font-semibold">Stock:</span> {previewProduct.stock ?? "-"}
                  </p>
                </div>

                {previewMeta.characteristics || previewMeta.colors || previewMeta.sizes ? (
                  <div className="grid gap-2 rounded-2xl border border-[#e3d7cd] bg-white/80 p-3 text-sm">
                    {previewMeta.characteristics ? (
                      <p>
                        <span className="font-semibold">Características:</span> {previewMeta.characteristics}
                      </p>
                    ) : null}
                    {previewMeta.colors ? (
                      <p>
                        <span className="font-semibold">Colores:</span> {previewMeta.colors}
                      </p>
                    ) : null}
                    {previewMeta.sizes ? (
                      <p>
                        <span className="font-semibold">Tamaños:</span> {previewMeta.sizes}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>,
            document.body
          )
        : null}

      <ConfirmDeleteModal
        isOpen={!!deleteConfirmId}
        title="Eliminar producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        itemName={deleteConfirmProduct?.name}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
