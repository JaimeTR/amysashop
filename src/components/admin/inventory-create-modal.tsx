"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegisteredTaxonomies } from "@/lib/use-registered-taxonomies";
import { useBrandNamesFromDB } from "@/lib/use-db-taxonomies";

type InventoryCreateModalProps = {
  categories: Array<{ id: string; name: string }>;
  createProductAction: (formData: FormData) => Promise<void>;
};

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueCategories(categories: Array<{ id: string; name: string }>) {
  const seen = new Map<string, { id: string; name: string }>();

  for (const category of categories) {
    const name = String(category.name || "").trim();
    if (!name) continue;

    const key = normalizeLabel(name);
    if (!seen.has(key)) {
      seen.set(key, { id: category.id, name });
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function InventoryCreateModal({ categories, createProductAction }: InventoryCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const categoryOptions = uniqueCategories(categories);
  const { brandNames } = useBrandNamesFromDB();
  const { genderOptions, ageGroupOptions } = useRegisteredTaxonomies();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      await createProductAction(formData);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        String((error as { digest?: unknown }).digest || "").includes("NEXT_REDIRECT")
      ) {
        throw error;
      }
      console.error("Error creando producto:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2"
      >
        <Plus className="size-4" />
        Nuevo Producto
      </Button>

      {open && mounted
        ? createPortal(
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/30 bg-white/95 p-5 shadow-2xl backdrop-blur-md"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-2xl">Registrar Nuevo Producto</h2>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              {/* Fila 1: Nombre | Género */}
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Nombre *</label>
                <input
                  name="name"
                  placeholder="Nombre del producto"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Género (Opcional)</label>
                <select
                  name="gender"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Seleccionar género</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Edad (Opcional)</label>
                <select
                  name="ageGroup"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Seleccionar edad</option>
                  {ageGroupOptions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Fila 2: Categoría | Número */}
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Categoría</label>
                <select
                  name="categoryId"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Seleccionar categoría</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Marca (Opcional)</label>
                <select
                  name="brand"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Seleccionar marca</option>
                  {brandNames.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Número/Referencia</label>
                <input
                  name="number"
                  placeholder="Ej: REF-001"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              {/* Fila 3: Imagen URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-black mb-1">URL de Imagen (Opcional)</label>
                <input
                  name="image"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              {/* Fila 4: Costo | Costo Operativo */}
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Precio Costo *</label>
                <input
                  name="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Costo Operativo *</label>
                <input
                  name="operating_cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                />
              </div>

              {/* Fila 5: Margen de Ganancia | Precio Sugerido */}
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Margen de Ganancia (%) *</label>
                <input
                  name="profit_margin"
                  type="number"
                  step="0.01"
                  placeholder="30"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Ej: 30 para 30%</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Precio Sugerido (Opcional)</label>
                <input
                  name="price_before"
                  type="number"
                  step="0.01"
                  placeholder="Referencia visual para marketing"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>

              {/* Nota sobre SKU */}
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-md p-2">
                  ℹ️ El SKU será generado automáticamente por el sistema de forma única, con formato AS000001.
                </p>
              </div>

              {/* Botones */}
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creando..." : "Crear Producto"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
