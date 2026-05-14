"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSafeProductImageSrc } from "@/lib/product-images";
import { Eye, Pencil, X, Search, Filter } from "lucide-react";
import { InventoryEditModal, type InventoryEditItem } from "@/components/admin/inventory-edit-modal";

type InventoryItem = {
  id: string;
  name: string;
  sku?: string;
  gender?: string;
  ageGroup?: string;
  brand?: string;
  category?: string;
  stock: number;
  cost: number;
  operating_cost: number;
  profit_margin: number;
  price: number;
  priceBefore?: number | null;
  images?: string[];
  active?: boolean;
};

function calculateSalePrice(item: Pick<InventoryItem, "cost" | "operating_cost" | "profit_margin">) {
  const totalCost = Math.max(0, Number(item.cost) || 0) + Math.max(0, Number(item.operating_cost) || 0);
  const margin = Math.max(0, Number(item.profit_margin) || 0);
  if (margin <= 0) return Number(totalCost.toFixed(2));

  // Regla solicitada: precio venta = (precio costo + costo operativo) / (1 - margen de ganancia)
  const normalizedMargin = margin >= 1 ? margin / 100 : margin;
  if (normalizedMargin >= 1) return Number(totalCost.toFixed(2));
  
  const divisor = 1 - normalizedMargin;
  if (divisor <= 0) return Number(totalCost.toFixed(2));

  return Number((totalCost / divisor).toFixed(2));
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

type GenderFilter = "" | "Hombre" | "Mujer" | "Unisex";

type Props = {
  rows: InventoryItem[];
  categoryOptions: string[];
  updateInventoryAction: (formData: FormData) => Promise<void>;
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
  initialSearchTerm?: string;
};

function getSafeImageSrc(images?: string[]) {
  return getSafeProductImageSrc(images || []);
}

export function InventoryTable({
  rows,
  categoryOptions,
  updateInventoryAction,
  currentPage = 1,
  pageSize = 20,
  totalCount,
  initialSearchTerm = "",
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>(rows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const normalizedGender = normalizeGender(selectedGender);
  const normalizedCategory = normalizeLabel(selectedCategory || "");
  const normalizedBrand = normalizeLabel(selectedBrand || "");

  useEffect(() => {
    setItems(rows);
  }, [rows]);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) || null,
    [editingId, items]
  );

  const filteredItems = useMemo(() => {
    // Nota: La búsqueda por nombre/código/etc se hace en SERVIDOR ahora (no en cliente)
    // Aquí solo aplicamos filtros facetados visuales opcionales
    return items.filter((item) => {
      const itemGender = normalizeGender(String(item.gender || ""));
      const itemCategory = normalizeLabel(String(item.category || ""));
      const itemBrand = normalizeLabel(String(item.brand || ""));

      const matchesGender = !normalizedGender || itemGender === normalizedGender;
      const matchesCategory = !normalizedCategory || itemCategory === normalizedCategory;
      const matchesBrand = !normalizedBrand || itemBrand === normalizedBrand;

      return matchesGender && matchesCategory && matchesBrand;
    });
  }, [items, normalizedGender, normalizedCategory, normalizedBrand]);

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
  };

  const handleDelete = async (item: InventoryItem) => {
    setPreviewId(item.id);
  };

  const previewItem = useMemo(() => items.find((item) => item.id === previewId) || null, [items, previewId]);
  const brandOptions = useMemo(() => uniqueLabels(items.map((item) => String(item.brand || "").trim()).filter(Boolean)), [items]);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!previewItem) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const modal = modalRef.current;
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = modal ? Array.from(modal.querySelectorAll<HTMLElement>(selector)) : [];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPreviewId(null);
        return;
      }
      if (e.key === "Tab") {
        if (!focusable.length) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKey);
    setTimeout(() => {
      (closeButtonRef.current ?? modal)?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      prevActive?.focus();
    };
  }, [previewItem]);
  // Subcategorías/submarcas no usadas en la tabla: usamos sólo `brand` y `category` registrados
  const genderOptions: GenderFilter[] = ["Hombre", "Mujer", "Unisex"];

  const totalCountLocal = totalCount ?? items.length;
  const totalPages = Math.max(1, Math.ceil(totalCountLocal / pageSize));

  const baseIndex = (currentPage - 1) * pageSize;

  return (
    <div className="space-y-3 pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-foreground">Gestión de Inventario</h3>
        <div className="relative w-full sm:max-w-md">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="size-10 shrink-0 rounded-md p-0"
              onClick={() => setShowQuickFilters((current) => !current)}
              aria-label="Abrir filtros"
            >
              <Filter className="size-4" />
            </Button>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  if (value.trim()) {
                    router.push(`?q=${encodeURIComponent(value.trim())}&page=1`);
                  } else {
                    router.push("?page=1");
                  }
                }}
                placeholder="Buscar por nombre, categoría, marca..."
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
      </div>

      <p className="text-xs text-muted-foreground">Mostrando {filteredItems.length} de {totalCountLocal} productos</p>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron productos con ese criterio.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#efe3d8] text-left">
              <tr>
                <th className="px-3 py-2">N°</th>
                <th className="px-3 py-2">Imagen</th>
                <th className="px-3 py-2 hidden sm:table-cell">SKU</th>
                <th className="px-3 py-2 min-w-[150px]">Nombre</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2 hidden md:table-cell">P. Costo</th>
                <th className="px-3 py-2 hidden lg:table-cell">Costo Op.</th>
                <th className="px-3 py-2 hidden lg:table-cell">Margen %</th>
                <th className="px-3 py-2 hidden xl:table-cell">P. Sugerido</th>
                <th className="px-3 py-2 hidden md:table-cell">P. Venta</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={item.id} className="border-t align-middle hover:bg-gray-50">
                  <td className="px-3 py-2 text-muted-foreground text-xs">{baseIndex + index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="overflow-hidden rounded-lg border border-[#e3d7cd] bg-white w-[40px] h-[40px] sm:w-[52px] sm:h-[52px]">
                      <Image
                        src={getSafeImageSrc(item.images)}
                        alt={item.name}
                        width={52}
                        height={52}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold text-primary hidden sm:table-cell text-xs">{item.sku || "Sin SKU"}</td>
                  <td className="px-3 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => setPreviewId(item.id)}
                      className="text-left text-foreground transition hover:text-primary truncate max-w-xs block"
                      title={item.name}
                    >
                      {item.name}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-info/10 text-info-foreground">
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell text-xs">S/ {Number(item.cost || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 hidden lg:table-cell text-xs">S/ {Number(item.operating_cost || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 hidden lg:table-cell text-xs">{Number(item.profit_margin || 0).toFixed(2)}%</td>
                  <td className="px-3 py-2 hidden xl:table-cell text-xs">
                    {item.priceBefore != null && Number(item.priceBefore) > 0 ? (
                      <span className="text-xs text-muted-foreground line-through">
                        S/ {Number(item.priceBefore).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell font-semibold text-primary text-xs">S/ {Number(item.price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => setPreviewId(item.id)}
                        aria-label="Visualizar"
                        className="h-8 w-8"
                      >
                        <Eye className="size-3 sm:size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        aria-label="Editar"
                        className="h-8 w-8"
                      >
                        <Pencil className="size-3 sm:size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push(`/admin/inventario?page=${Math.max(1, currentPage - 1)}`)}
          disabled={currentPage <= 1}
          className="rounded-md border px-3 py-1 text-sm"
        >
          Anterior
        </button>
        <span className="text-sm text-muted-foreground">Página {currentPage} / {totalPages}</span>
        <button
          type="button"
          onClick={() => router.push(`/admin/inventario?page=${Math.min(totalPages, currentPage + 1)}`)}
          disabled={currentPage >= totalPages}
          className="rounded-md border px-3 py-1 text-sm"
        >
          Siguiente
        </button>
      </div>

      <InventoryEditModal
        item={editingItem ? {
          id: editingItem.id,
          name: editingItem.name,
          sku: editingItem.sku,
          category: editingItem.category,
          brand: editingItem.brand,
          gender: editingItem.gender,
          ageGroup: editingItem.ageGroup,
          stock: editingItem.stock,
          cost: editingItem.cost,
          operating_cost: editingItem.operating_cost,
          profit_margin: editingItem.profit_margin,
          priceBefore: editingItem.priceBefore,
          active: editingItem.active,
        } : null}
        updateInventoryAction={updateInventoryAction}
        onClose={handleCancel}
      />

      {previewItem
        ? createPortal(
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4" onClick={() => setPreviewId(null)}>
              <div
                ref={modalRef}
                tabIndex={-1}
                className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/30 bg-[#fcf8f5] shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#e3d7cd] px-5 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Vista de inventario</p>
                    <h3 className="font-[var(--font-display)] text-2xl text-foreground">{previewItem.name}</h3>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewId(null)} aria-label="Cerrar vista" className="absolute top-3 right-3" ref={closeButtonRef}>
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="grid gap-5 p-4 md:p-5 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] items-start">
                  <div className="space-y-2">
                    <div className="overflow-hidden rounded-2xl border border-[#e3d7cd] bg-white">
                      <Image
                        src={getSafeImageSrc(previewItem.images)}
                        alt={previewItem.name}
                        width={420}
                        height={420}
                        className="h-56 md:h-[260px] lg:h-[420px] w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-[var(--font-display)] text-2xl text-foreground">{previewItem.name}</h4>

                    <div className="flex flex-wrap gap-2">
                      {previewItem.category ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {previewItem.category}
                        </span>
                      ) : null}
                      {previewItem.brand ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {previewItem.brand}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      {previewItem.priceBefore && previewItem.priceBefore > previewItem.price ? (
                        <p className="text-sm font-medium text-muted-foreground line-through">S/ {Number(previewItem.priceBefore).toFixed(2)}</p>
                      ) : null}
                      <p className="text-2xl font-bold text-primary">S/ {Number(previewItem.price || 0).toFixed(2)}</p>
                    </div>

                    <p className="text-sm text-foreground">{previewItem.sku ? `SKU: ${previewItem.sku}` : 'Sin SKU'}</p>

                    <div className="grid gap-2 rounded-2xl border border-[#e3d7cd] bg-white/80 p-3 text-sm">
                      <p>
                        <span className="font-semibold">Género:</span> {previewItem.gender || "-"}
                      </p>

                      <p>
                        <span className="font-semibold">Edad:</span> {previewItem.ageGroup || "-"}
                      </p>

                      <p>
                        <span className="font-semibold">Categoría:</span> {previewItem.category || "Sin categoría"}
                      </p>

                      <p>
                        <span className="font-semibold">Stock:</span> {previewItem.stock ?? "-"}
                      </p>
                    </div>

                    <div className="grid gap-2 rounded-2xl border border-[#e3d7cd] bg-white/80 p-3 text-sm">
                      <p>
                        <span className="font-semibold">Precio costo:</span> S/ {Number(previewItem.cost || 0).toFixed(2)}
                      </p>
                      <p>
                        <span className="font-semibold">Costo operativo:</span> S/ {Number(previewItem.operating_cost || 0).toFixed(2)}
                      </p>
                      <p>
                        <span className="font-semibold">Margen:</span> {Number(previewItem.profit_margin || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

    </div>
  );
}
