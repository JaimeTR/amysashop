"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, Pencil, Trash2, X, Search, Filter } from "lucide-react";
import { InventoryEditModal, type InventoryEditItem } from "@/components/admin/inventory-edit-modal";

type InventoryItem = {
  id: string;
  name: string;
  gender?: string;
  ageGroup?: string;
  brand?: string;
  category: string;
  stock: number;
  cost: number;
  operating_cost: number;
  profit_margin: number;
  price: number;
  priceBefore?: number | null;
  images?: string[];
  active?: boolean;
};

type EditingItem = InventoryItem & {
  _isDirty: boolean;
};

type Props = {
  rows: InventoryItem[];
  categoryOptions: string[];
  updateInventoryAction: (formData: FormData) => Promise<void>;
  deleteInventoryItemAction: (formData: FormData) => Promise<void>;
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
};

type GenderFilter = "" | "Hombres" | "Mujeres" | "Niños";

function getSafeImageSrc(images?: string[]) {
  const candidate = (images || []).find(
    (img) => String(img || "").trim().startsWith("/") || /^https?:\/\//i.test(String(img || ""))
  );
  return candidate || "/placeholder-product.svg";
}

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

export function InventoryTable({
  rows,
  categoryOptions,
  updateInventoryAction,
  deleteInventoryItemAction,
  currentPage = 1,
  pageSize = 20,
  totalCount,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>(rows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<InventoryItem | null>(null);
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
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const itemGender = normalizeGender(String(item.gender || ""));
      const itemCategory = normalizeLabel(String(item.category || ""));
      const itemBrand = normalizeLabel(String(item.brand || ""));

      const matchesGender = !normalizedGender || itemGender === normalizedGender;
      const matchesCategory = !normalizedCategory || itemCategory === normalizedCategory;
      const matchesBrand = !normalizedBrand || itemBrand === normalizedBrand;

      const searchable = [
        item.name,
        item.gender || "",
        item.brand || "",
        item.category,
        String(item.price),
        String(item.stock),
      ]
        .join(" ")
        .toLowerCase();
      return matchesGender && matchesCategory && matchesBrand && (!term || searchable.includes(term));
    });
  }, [items, searchTerm, normalizedGender, normalizedCategory, normalizedBrand]);

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
  };

  const handleDelete = async (item: InventoryItem) => {
    try {
      setIsDeletingId(item.id);
      const formData = new FormData();
      formData.set("productId", item.id);
      await deleteInventoryItemAction(formData);
      setItems((prev) => prev.filter((candidate) => candidate.id !== item.id));
      if (previewId === item.id) {
        setPreviewId(null);
      }
      router.refresh();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
    } finally {
      setIsDeletingId(null);
      setPendingDeleteItem(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteItem) return;
    await handleDelete(pendingDeleteItem);
  };

  const previewItem = useMemo(() => items.find((item) => item.id === previewId) || null, [items, previewId]);
  const brandOptions = useMemo(() => uniqueLabels(items.map((item) => String(item.brand || "").trim()).filter(Boolean)), [items]);
  // Subcategorías/submarcas no usadas en la tabla: usamos sólo `brand` y `category` registrados
  const genderOptions: GenderFilter[] = ["Hombres", "Mujeres", "Niños"];

  const totalCountLocal = totalCount ?? items.length;
  const totalPages = Math.max(1, Math.ceil(totalCountLocal / pageSize));

  const baseIndex = (currentPage - 1) * pageSize;

  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-foreground">Gestión de Inventario</h3>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="overflow-x-auto rounded-xl border bg-white/80">
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-[#efe3d8] text-left">
              <tr>
                <th className="px-3 py-2">N°</th>
                <th className="px-3 py-2">Imagen</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Marca</th>
                <th className="px-3 py-2">Género</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Precio Costo</th>
                <th className="px-3 py-2">Costo Op.</th>
                <th className="px-3 py-2">Margen %</th>
                <th className="px-3 py-2">Precio Sugerido</th>
                <th className="px-3 py-2">Precio Venta</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={item.id} className="border-t align-middle hover:bg-gray-50">
                  <td className="px-3 py-2 text-muted-foreground">{baseIndex + index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="overflow-hidden rounded-lg border border-[#e3d7cd] bg-white w-[52px] h-[52px]">
                      <Image
                        src={getSafeImageSrc(item.images)}
                        alt={item.name}
                        width={52}
                        height={52}
                        className="h-[52px] w-[52px] object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => setPreviewId(item.id)}
                      className="text-left text-foreground transition hover:text-primary"
                    >
                      {item.name}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-sm">{item.category}</td>
                  <td className="px-3 py-2 text-sm">{item.category}</td>
                  <td className="px-3 py-2 text-sm">{item.brand || "-"}</td>
                  <td className="px-3 py-2 text-sm">{item.gender || "-"}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700">
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-3 py-2">S/ {Number(item.cost || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">S/ {Number(item.operating_cost || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{Number(item.profit_margin || 0).toFixed(2)}%</td>
                  <td className="px-3 py-2">
                    {item.priceBefore != null && Number(item.priceBefore) > 0 ? (
                      <span className="text-xs text-muted-foreground line-through">
                        S/ {Number(item.priceBefore).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-semibold text-primary">S/ {Number(item.price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => setPreviewId(item.id)}
                        aria-label="Visualizar"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => setPendingDeleteItem(item)}
                        disabled={isDeletingId === item.id}
                        aria-label="Eliminar"
                      >
                        {isDeletingId === item.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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
          gender: editingItem.gender,
          ageGroup: editingItem.ageGroup,
          category: editingItem.category,
          stock: editingItem.stock,
          cost: editingItem.cost,
          operating_cost: editingItem.operating_cost,
          profit_margin: editingItem.profit_margin,
          priceBefore: editingItem.priceBefore,
          active: editingItem.active,
        } : null}
        categoryOptions={categoryOptions}
        updateInventoryAction={updateInventoryAction}
        onClose={handleCancel}
      />

      {previewItem
        ? createPortal(
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4" onClick={() => setPreviewId(null)}>
              <div
                className="w-full max-w-xl rounded-3xl border border-white/30 bg-white/95 p-5 shadow-2xl backdrop-blur-md"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-[var(--font-display)] text-2xl text-foreground">{previewItem.name}</h3>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewId(null)} aria-label="Cerrar">
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-xl border border-[#e3d7cd] bg-white">
                    <Image
                      src={getSafeImageSrc(previewItem.images)}
                      alt={previewItem.name}
                      width={120}
                      height={120}
                      className="h-[120px] w-[120px] object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold">Género:</span> {previewItem.gender || "-"}</p>
                    <p><span className="font-semibold">Edad:</span> {previewItem.ageGroup || "-"}</p>
                    <p><span className="font-semibold">Categoría:</span> {previewItem.category || "Sin categoría"}</p>
                    <p><span className="font-semibold">Stock:</span> {previewItem.stock}</p>
                    <p><span className="font-semibold">Precio costo:</span> S/ {Number(previewItem.cost || 0).toFixed(2)}</p>
                    <p><span className="font-semibold">Costo operativo:</span> S/ {Number(previewItem.operating_cost || 0).toFixed(2)}</p>
                    <p><span className="font-semibold">Margen:</span> {Number(previewItem.profit_margin || 0).toFixed(2)}%</p>
                    <p><span className="font-semibold">Precio sugerido:</span> {previewItem.priceBefore != null ? `S/ ${Number(previewItem.priceBefore).toFixed(2)}` : "-"}</p>
                    <p><span className="font-semibold">Precio venta:</span> S/ {Number(previewItem.price || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {pendingDeleteItem
        ? createPortal(
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 p-4">
              <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-foreground">Eliminar producto</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  ¿Seguro que quieres eliminar <span className="font-semibold text-foreground">{pendingDeleteItem.name}</span>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPendingDeleteItem(null)}
                    disabled={isDeletingId === pendingDeleteItem.id}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleConfirmDelete}
                    disabled={isDeletingId === pendingDeleteItem.id}
                  >
                    {isDeletingId === pendingDeleteItem.id ? "Eliminando..." : "Sí, eliminar"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
