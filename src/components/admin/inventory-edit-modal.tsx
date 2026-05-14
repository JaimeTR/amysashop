"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/components/feedback/notification-center";

export type InventoryEditItem = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  gender?: string;
  ageGroup?: string;
  stock: number;
  cost: number;
  operating_cost: number;
  profit_margin: number;
  priceBefore?: number | null;
  active?: boolean;
};

type Props = {
  item: InventoryEditItem | null;
  updateInventoryAction: (formData: FormData) => Promise<void>;
  onClose: () => void;
};

function calculateSalePrice(item: Pick<InventoryEditItem, "cost" | "operating_cost" | "profit_margin">) {
  const totalCost = Math.max(0, Number(item.cost) || 0) + Math.max(0, Number(item.operating_cost) || 0);
  const margin = Math.max(0, Number(item.profit_margin) || 0);

  if (margin <= 0) return Number(totalCost.toFixed(2));

  const normalizedMargin = margin >= 1 ? margin / 100 : margin;
  if (normalizedMargin >= 1) return Number(totalCost.toFixed(2));

  const divisor = 1 - normalizedMargin;
  if (divisor <= 0) return Number(totalCost.toFixed(2));

  return Number((totalCost / divisor).toFixed(2));
}

export function InventoryEditModal({ item, updateInventoryAction, onClose }: Props) {
  const router = useRouter();
  const notify = useNotify();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState({
    stock: String(item?.stock ?? 0),
    cost: String(item?.cost ?? 0),
    operating_cost: String(item?.operating_cost ?? 0),
    profit_margin: String(item?.profit_margin ?? 0),
    priceBefore: item?.priceBefore == null ? "" : String(item.priceBefore),
    active: Boolean(item?.active),
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!item) return;
    setFormState({
      stock: String(item.stock ?? 0),
      cost: String(item.cost ?? 0),
      operating_cost: String(item.operating_cost ?? 0),
      profit_margin: String(item.profit_margin ?? 0),
      priceBefore: item.priceBefore == null ? "" : String(item.priceBefore),
      active: Boolean(item.active),
    });
  }, [item]);

  const salePrice = useMemo(
    () =>
      calculateSalePrice({
        cost: Number(formState.cost || 0),
        operating_cost: Number(formState.operating_cost || 0),
        profit_margin: Number(formState.profit_margin || 0),
      }),
    [formState.cost, formState.operating_cost, formState.profit_margin]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("productId", item.id);
      formData.set("stock", formState.stock);
      formData.set("cost", formState.cost);
      formData.set("operating_cost", formState.operating_cost);
      formData.set("profit_margin", formState.profit_margin);
      formData.set("price_before", formState.priceBefore);
      formData.set("active", formState.active ? "on" : "off");

      await updateInventoryAction(formData);

      notify.success("Inventario actualizado", "El stock y precios se han guardado correctamente");
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 500);
    } catch (error) {
      notify.error(
        "Error al actualizar",
        error instanceof Error ? error.message : "No se pudo actualizar el inventario"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!item || !mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Registro</p>
            <h2 className="font-[var(--font-display)] text-3xl text-black">Editar inventario</h2>
            <p className="text-sm text-black/60">Ajusta stock y precios sin modificar la ficha base del producto.</p>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={onClose} disabled={loading} aria-label="Cerrar modal">
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-[#e3d7cd] bg-white/80 p-4 text-sm md:grid-cols-2">
            <p><span className="font-semibold">Producto:</span> {item.name}</p>
            <p><span className="font-semibold">SKU:</span> {item.sku || "-"}</p>
            <p><span className="font-semibold">Categoría:</span> {item.category || "Sin categoría"}</p>
            <p><span className="font-semibold">Marca:</span> {item.brand || "-"}</p>
            <p><span className="font-semibold">Género:</span> {item.gender || "-"}</p>
            <p><span className="font-semibold">Edades:</span> {item.ageGroup || "-"}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="stock" className="mb-1 block text-xs font-semibold text-black">Stock</label>
              <input
                name="stock"
                 id="stock"
                type="number"
                min="0"
                value={formState.stock}
                onChange={(event) => setFormState((prev) => ({ ...prev, stock: event.target.value }))}
                className="w-full h-10 rounded-lg border border-[#e3d7cd] bg-white/95 px-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="cost" className="mb-1 block text-xs font-semibold text-black">Precio costo</label>
              <input
                name="cost"
                 id="cost"
                type="number"
                step="0.01"
                min="0"
                value={formState.cost}
                onChange={(event) => setFormState((prev) => ({ ...prev, cost: event.target.value }))}
                className="w-full h-10 rounded-lg border border-[#e3d7cd] bg-white/95 px-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
            <div>
              <label htmlFor="operating_cost" className="mb-1 block text-xs font-semibold text-black">Costo operativo</label>
              <input
                name="operating_cost"
                 id="operating_cost"
                type="number"
                step="0.01"
                min="0"
                value={formState.operating_cost}
                onChange={(event) => setFormState((prev) => ({ ...prev, operating_cost: event.target.value }))}
                className="w-full h-10 rounded-lg border border-[#e3d7cd] bg-white/95 px-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
            <div>
              <label htmlFor="profit_margin" className="mb-1 block text-xs font-semibold text-black">Margen %</label>
              <input
                name="profit_margin"
                 id="profit_margin"
                type="number"
                step="0.01"
                min="0"
                value={formState.profit_margin}
                onChange={(event) => setFormState((prev) => ({ ...prev, profit_margin: event.target.value }))}
                className="w-full h-10 rounded-lg border border-[#e3d7cd] bg-white/95 px-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="price_before" className="mb-1 block text-xs font-semibold text-black">Precio sugerido</label>
              <input
                name="price_before"
                 id="price_before"
                type="number"
                step="0.01"
                min="0"
                value={formState.priceBefore}
                onChange={(event) => setFormState((prev) => ({ ...prev, priceBefore: event.target.value }))}
                placeholder="Opcional"
                className="w-full h-10 rounded-lg border border-[#e3d7cd] bg-white/95 px-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary self-end">
              Precio venta calculado: S/ {salePrice.toFixed(2)}
            </div>
          </div>

          <label htmlFor="inventory-active" className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              id="inventory-active"
              type="checkbox"
              checked={formState.active}
              onChange={(event) => setFormState((prev) => ({ ...prev, active: event.target.checked }))}
              className="size-4 rounded border-input"
            />
            Mostrar al cliente
          </label>

          <div className="flex gap-3 border-t border-[#e3d7cd] pt-4">
            <Button type="submit" disabled={loading} className="flex-1 bg-primary text-white hover:bg-primary/90">
              {loading ? "Actualizando..." : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border-primary/30 text-primary hover:bg-primary/5"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
