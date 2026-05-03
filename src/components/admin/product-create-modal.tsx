"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canonicalizeBrandName } from "@/lib/brands";
import { useRegisteredTaxonomies } from "@/lib/use-registered-taxonomies";

type CategoryOption = {
  id: string;
  name: string;
};

type Props = {
  categories: CategoryOption[];
  brands: string[];
  subBrands: Array<{ name: string; brand: string }>;
  subCategories: Array<{ name: string; category: string }>;
  createProductAction: (formData: FormData) => void;
};

const baseInputClass =
  "w-full h-10 rounded-lg border border-[#e3d7cd] bg-white/95 px-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25";
const selectInputClass = `${baseInputClass} appearance-none cursor-pointer`;

function normalizeLabel(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueCategories(categories: CategoryOption[]) {
  const seen = new Map<string, CategoryOption>();

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

export function ProductCreateModal({ categories, brands, subBrands, subCategories, createProductAction }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [mainImageUrls, setMainImageUrls] = useState<string>("");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string>("");
  const [mainUploadedFiles, setMainUploadedFiles] = useState<File[]>([]);
  const [galleryUploadedFiles, setGalleryUploadedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSubBrand, setSelectedSubBrand] = useState("");
  const categoryOptions = uniqueCategories(categories);
  const { genderOptions, ageGroupOptions } = useRegisteredTaxonomies();

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
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMainUploadedFiles(files.slice(0, 1));
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeMainUploadedFile = (index: number) => {
    setMainUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeGalleryUploadedFile = (index: number) => {
    setGalleryUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      if (mainImageUrls.trim()) {
        formData.set("mainImageUrls", mainImageUrls);
      }

      if (galleryImageUrls.trim()) {
        formData.set("galleryImageUrls", galleryImageUrls);
      }

      mainUploadedFiles.forEach((file) => {
        formData.append("mainFiles", file);
      });

      galleryUploadedFiles.forEach((file) => {
        formData.append("galleryFiles", file);
      });

      if (mainFileInputRef.current) {
        mainFileInputRef.current.value = "";
      }

      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = "";
      }

      await createProductAction(formData);

      // Mostrar notificación de éxito
      setNotification({ type: "success", message: "Producto guardado exitosamente" });

      // Limpiar formulario y cerrar modal
      setTimeout(() => {
        setOpen(false);
        setMainImageUrls("");
        setGalleryImageUrls("");
        setMainUploadedFiles([]);
        setGalleryUploadedFiles([]);
        setSelectedCategory("");
        setSelectedBrand("");
        setSelectedSubCategory("");
        setSelectedSubBrand("");
        setNotification(null);
        if (formRef.current) {
          formRef.current.reset();
        }
      }, 1500);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Error al guardar el producto",
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="bg-primary text-white hover:bg-primary/90">
        <Plus className="mr-2 size-4" />Agregar nuevo producto
      </Button>

      {open && mounted
        ? createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Notificación */}
        {notification && (
          <div
            className={`mb-4 rounded-lg p-4 text-sm font-medium ${
              notification.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Encabezado */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-black/60 uppercase tracking-wide">Registro</p>
            <h2 className="font-[var(--font-display)] text-3xl text-black">Nuevo producto</h2>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Fila 1: Nombre | Aviso SKU */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Nombre</label>
              <input
                name="name"
                placeholder="Nombre del producto"
                required
                className={baseInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">SKU</label>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                El SKU será generado automáticamente con formato AS000001 y no será editable.
              </div>
            </div>
          </div>

          {/* Fila 2: Categoría | Marca */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Categoría</label>
              <select
                name="category"
                required
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setSelectedSubCategory("");
                }}
                className={`${selectInputClass}`}
              >
                <option value="">Seleccionar categoría</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Marca</label>
              <select
                name="brand"
                required
                value={selectedBrand}
                onChange={(event) => {
                  setSelectedBrand(event.target.value);
                  setSelectedSubBrand("");
                }}
                className={`${selectInputClass}`}
              >
                <option value="">Seleccionar marca</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 3: Subcategoría | Submarca (opcionales) */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Subcategoría</label>
              <select
                name="subCategory"
                value={selectedSubCategory}
                onChange={(event) => setSelectedSubCategory(event.target.value)}
                className={selectInputClass}
                disabled={!selectedCategory || availableSubCategories.length === 0}
              >
                <option value="">
                  {!selectedCategory
                    ? "Selecciona categoría primero"
                    : availableSubCategories.length === 0
                      ? "Sin subcategorías registradas"
                      : "Seleccionar subcategoría"}
                </option>
                {availableSubCategories.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Submarca</label>
              <select
                name="subBrand"
                value={selectedSubBrand}
                onChange={(event) => setSelectedSubBrand(event.target.value)}
                className={selectInputClass}
                disabled={!selectedBrand || availableSubBrands.length === 0}
              >
                <option value="">
                  {!selectedBrand
                    ? "Selecciona marca primero"
                    : availableSubBrands.length === 0
                      ? "Sin submarcas registradas"
                      : "Seleccionar submarca"}
                </option>
                {availableSubBrands.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 4: Género | Edad */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Género</label>
              <select name="gender" className={selectInputClass}>
                <option value="">Seleccionar género</option>
                {genderOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Edad</label>
              <select name="ageGroup" className={selectInputClass}>
                <option value="">Seleccionar edad</option>
                {ageGroupOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 5: Precio actual | Precio sugerido | Stock */}
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Precio actual</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className={baseInputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Precio sugerido (opcional)</label>
              <input
                name="priceBefore"
                type="number"
                step="0.01"
                min="0"
                placeholder="Referencia visual para marketing"
                className={baseInputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                required
                placeholder="0"
                className={baseInputClass}
              />
            </div>
          </div>

          {/* Descripción corta */}
          <div>
            <label className="block text-xs font-semibold text-black mb-1">Descripción corta</label>
            <textarea
              name="description"
              placeholder="Descripción breve del producto para la página de detalle"
              rows={2}
              className="w-full rounded-lg border border-[#e3d7cd] bg-white/95 px-3 py-2 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-[#e3d7cd] bg-[#fcf8f5] p-4">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-black">Foto principal</label>
                <p className="text-[11px] text-black/60">Se usa como portada en tarjetas, detalle y listados.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={mainImageUrls}
                  onChange={(e) => setMainImageUrls(e.target.value)}
                  placeholder="https://ejemplo.com/portada.jpg"
                  className={baseInputClass}
                />
                <div className="relative">
                  <input
                    ref={mainFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMainFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div className="flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/35 bg-white cursor-pointer transition hover:bg-[#f7efe9]">
                    <Upload className="size-4 text-primary" />
                    <span className="text-xs text-black/70">Subir foto principal</span>
                  </div>
                </div>
              </div>

              {mainUploadedFiles.length > 0 ? (
                <div className="space-y-1">
                  {mainUploadedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-[#e3d7cd] bg-white p-2">
                      <span className="text-xs text-black">{file.name}</span>
                      <button type="button" onClick={() => removeMainUploadedFile(index)} className="text-rose-600 hover:text-rose-700">
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-[#e3d7cd] pt-4">
              <div>
                <label className="block text-xs font-semibold text-black">Galería de fotos o videos</label>
                <p className="text-[11px] text-black/60">Aquí van los elementos adicionales que se verán en la página del producto.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={galleryImageUrls}
                  onChange={(e) => setGalleryImageUrls(e.target.value)}
                  placeholder="https://ejemplo.com/foto2.jpg, https://ejemplo.com/video.mp4"
                  className={baseInputClass}
                />
                <div className="relative">
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleGalleryFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div className="flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/35 bg-white cursor-pointer transition hover:bg-[#f7efe9]">
                    <Upload className="size-4 text-primary" />
                    <span className="text-xs text-black/70">Subir galería</span>
                  </div>
                </div>
              </div>

              {galleryUploadedFiles.length > 0 ? (
                <div className="space-y-1">
                  {galleryUploadedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-[#e3d7cd] bg-white p-2">
                      <span className="text-xs text-black">{file.name}</span>
                      <button type="button" onClick={() => removeGalleryUploadedFile(index)} className="text-rose-600 hover:text-rose-700">
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>


          {/* Visibilidad (Switch) */}
          <div className="flex items-center gap-3 rounded-lg border border-[#e3d7cd] bg-[#fcf8f5] p-3">
            <div className="flex-1">
              <label className="text-sm font-semibold text-black">Mostrar al cliente</label>
              <p className="text-xs text-black/60">Activar para que el producto sea visible en la tienda</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                name="active"
                type="checkbox"
                defaultChecked
                className="sr-only peer"
              />
              <div className="peer h-6 w-11 rounded-full bg-[#d9c7b8] peer-checked:bg-primary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[#d9c7b8] after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t border-black/10">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? "Guardando..." : "Guardar producto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
          )
        : null}
    </>
  );
}
