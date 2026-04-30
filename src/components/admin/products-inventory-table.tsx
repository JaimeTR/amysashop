"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Copy, Eye, Filter, Pencil, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductEditModal } from "@/components/admin/product-edit-modal";
import { ProductCloneModal } from "@/components/admin/product-clone-modal";
import { ConfirmDeleteModal } from "@/components/feedback/confirm-delete-modal";

type InventoryRow = {
  id: string;
  sku: string;
  name: string;
  gender?: string;
  ageGroup?: string;
  brand: string;
  category: string;
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

function isSafeImageSrc(value: string) {
  const src = String(value || "").trim();
  return src.startsWith("/") || /^https?:\/\//i.test(src);
}

function getSafeImageSrc(images: string[]) {
  const candidate = (images || []).find(isSafeImageSrc);
  return candidate || "/placeholder-product.svg";
}

type Props = {
  rows: InventoryRow[];
  categoryOptions: string[];
  brandOptions: string[];
  updateProductAction: (formData: FormData) => Promise<void>;
  cloneProductAction: (formData: FormData) => Promise<void>;
  deleteProductAction: (formData: FormData) => Promise<void>;
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
};

type GenderFilter = "" | "Hombres" | "Mujeres" | "Niños";

function normalizeGender(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.startsWith("hom")) return "Hombres";
  if (normalized.startsWith("muj") || normalized.startsWith("fem")) return "Mujeres";
  if (normalized.startsWith("niñ") || normalized.startsWith("nin") || normalized.includes("child")) return "Niños";
  return String(value || "").trim();
}

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[00-\u036f]/g, "");
}

export function ProductsInventoryTable({
  rows,
  categoryOptions,
  brandOptions,
  updateProductAction,
  cloneProductAction,
  deleteProductAction,
  currentPage = 1,
  pageSize = 20,
  totalCount,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const previewProduct = useMemo(() => rows.find((row) => row.id === previewProductId) ?? null, [rows, previewProductId]);
  const previewMeta = useMemo(
    () => (previewProduct ? buildProductDetailMeta(previewProduct.rawDescription || "", previewProduct.description || "") : null),
    [previewProduct]
  );

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
    const normalizedBrand = normalizeLabel(selectedBrand || "");

    return rows.filter((row) => {
      const rowGender = normalizeGender(String(row.gender || ""));
        const searchable = [
          row.sku,
          row.name,
          row.brand,
          row.category,
          String(row.price),
          String(row.stock),
          row.active ? "si" : "no",
        ]
        .join(" ")
        .toLowerCase();

      const matchesText = !term || searchable.includes(term);
      const matchesGender = !normalizedGender || rowGender === normalizedGender;
      const matchesCategory = !normalizedCategory || normalizeLabel(String(row.category || "")) === normalizedCategory;
      const matchesBrand = !normalizedBrand || normalizeLabel(String(row.brand || "")) === normalizedBrand;

      return matchesText && matchesGender && matchesCategory && matchesBrand;
    });
  }, [rows, query, selectedCategory, selectedBrand, normalizedGender]);

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
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-xl border border-[#e3d7cd] bg-white p-3 shadow-lg sm:w-[360px]">
              <div className="grid gap-3">
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Género
                  <select
                    value={selectedGender}
                    onChange={(event) => setSelectedGender(event.target.value as GenderFilter)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  >
                    <option value="">Todos</option>
                    {(["Hombres", "Mujeres", "Niños"] as GenderFilter[]).map((option) => (
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
                    {categoryOptions.map((option) => (
                      <option key={option} value={normalizeLabel(option)}>
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
                    {brandOptions.map((option) => (
                      <option key={option} value={normalizeLabel(option)}>
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
                        categories={categoryOptions}
                        brand={row.brand}
                        brands={brandOptions}
                        
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
                      <ProductCloneModal
                        productId={row.id}
                        name={row.name}
                        code={row.sku}
                        category={row.category}
                        categories={categoryOptions}
                        brand={row.brand}
                        brands={brandOptions}
                        
                        price={row.price}
                        priceBefore={row.priceBefore}
                        stock={row.stock}
                        description={row.description}
                        images={row.images}
                        active={row.active}
                        cloneProductAction={cloneProductAction}
                        triggerMode="icon"
                        triggerIcon={<Copy className="size-4" />}
                        triggerAriaLabel="Clonar"
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
                  
                  {previewProduct.ageGroup ? (
                    <p>
                      <span className="font-semibold">Edad:</span> {previewProduct.ageGroup}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold">Stock:</span> {previewProduct.stock}
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
