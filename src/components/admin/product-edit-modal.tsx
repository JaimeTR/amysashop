"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegisteredTaxonomies } from "@/lib/use-registered-taxonomies";

type Props = {
  productId: string;
  name: string;
  code: string;
  gender: string;
  ageGroup: string;
  category: string;
  categories: string[];
  brand: string;
  brands: string[];
  price: number;
  priceBefore: number | null;
  stock: number;
  description: string;
  images: string[];
  active: boolean;
  updateProductAction: (formData: FormData) => Promise<void>;
  triggerMode?: "text" | "icon";
  triggerIcon?: React.ReactNode;
  triggerAriaLabel?: string;
};

export function ProductEditModal({
  productId,
  name,
  code,
  gender,
  ageGroup,
  category,
  categories,
  brand,
  brands,
  price,
  priceBefore,
  stock,
  description,
  images,
  active,
  updateProductAction,
  triggerMode = "text",
  triggerIcon,
  triggerAriaLabel,
}: Props) {
  const isVideoMedia = (value: string) => /\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(String(value || "").trim());
  const firstImage = images.find((item) => item && !isVideoMedia(item)) || "";
  const galleryItems = images.filter((item) => item && item !== firstImage);

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [mainImageUrls, setMainImageUrls] = useState(firstImage);
  const [galleryImageUrls, setGalleryImageUrls] = useState(galleryItems.join(", "));
  const [mainUploadedFiles, setMainUploadedFiles] = useState<File[]>([]);
  const [galleryUploadedFiles, setGalleryUploadedFiles] = useState<File[]>([]);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const { genderOptions, ageGroupOptions } = useRegisteredTaxonomies();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const baseInputClass =
    "h-10 w-full rounded-lg border border-[#e3d7cd] bg-white/95 px-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25";
  const selectInputClass = `${baseInputClass} appearance-none cursor-pointer`;

  const handleMainFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMainUploadedFiles(files.slice(0, 1));
  };

  const handleGalleryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setGalleryUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeMainUploadedFile = (index: number) => {
    setMainUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeGalleryUploadedFile = (index: number) => {
    setGalleryUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
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

      await updateProductAction(formData);
      setNotification({ type: "success", message: "Producto actualizado correctamente" });

      setTimeout(() => {
        setOpen(false);
        setMainUploadedFiles([]);
        setGalleryUploadedFiles([]);
        setNotification(null);
        router.refresh();
      }, 900);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo actualizar el producto",
      });
      setTimeout(() => setNotification(null), 2500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size={triggerMode === "icon" ? "icon" : "sm"}
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={triggerAriaLabel || "Editar"}
      >
        {triggerMode === "icon" ? triggerIcon || "E" : "Editar"}
      </Button>

      {open && mounted
        ? createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        {notification && (
          <div
            className={`mb-4 rounded-lg p-3 text-sm font-medium ${
              notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Registro</p>
            <h2 className="font-[var(--font-display)] text-3xl text-black">Editar producto</h2>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="code" value={code} />

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Nombre</label>
              <input name="name" defaultValue={name} placeholder="Nombre del producto" required className={baseInputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">SKU generado</label>
              <div className="flex h-10 items-center rounded-lg border border-[#e3d7cd] bg-[#f4eee9] px-3 text-sm font-semibold text-black/75">
                {code || "Sin SKU"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Género</label>
                <select name="gender" defaultValue={gender} className={selectInputClass}>
                  <option value="">Seleccionar género</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g.toLowerCase()}>{g}</option>
                  ))}
                </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Edad</label>
                <select name="ageGroup" defaultValue={ageGroup} required className={selectInputClass}>
                  <option value="">Seleccionar edad</option>
                  {ageGroupOptions.map((a) => (
                    <option key={a} value={a.toLowerCase()}>{a}</option>
                  ))}
                </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Marca</label>
              <select name="brand" defaultValue={brand} required className={selectInputClass}>
                <option value="">Seleccionar marca</option>
                {brands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Categoría</label>
              <select name="category" defaultValue={category} required className={selectInputClass}>
                <option value="">Seleccionar categoría</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Precio actual</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                readOnly
                disabled
                className={`${baseInputClass} cursor-not-allowed bg-[#f4eee9] text-black/70`}
              />
              <p className="mt-1 text-[11px] text-black/55">Se define automaticamente en Inventario</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Precio sugerido (opcional)</label>
              <input name="priceBefore" type="number" step="0.01" min="0" defaultValue={priceBefore || ""} placeholder="Referencia visual para marketing" className={baseInputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Stock</label>
              <input name="stock" type="number" min="0" defaultValue={stock} required className={baseInputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-black">Descripción corta</label>
            <textarea
              name="description"
              defaultValue={description}
              rows={2}
              className="w-full rounded-lg border border-[#e3d7cd] bg-white/95 px-3 py-2 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-[#e3d7cd] bg-[#fcf8f5] p-4">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-black">Foto principal</label>
                <p className="text-[11px] text-black/60">Esta portada se usa primero en la página del producto y en miniaturas generales.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={mainImageUrls}
                  onChange={(event) => setMainImageUrls(event.target.value)}
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
                  <div className="flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/35 bg-[#fcf8f5] px-2">
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
                <p className="text-[11px] text-black/60">Estos elementos se mostrarán en el detalle del producto como miniaturas.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={galleryImageUrls}
                  onChange={(event) => setGalleryImageUrls(event.target.value)}
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
                  <div className="flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/35 bg-[#fcf8f5] px-2">
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

          <div className="flex items-center gap-3 rounded-lg border border-[#e3d7cd] bg-[#fcf8f5] p-3">
            <div className="flex-1">
              <label className="text-sm font-semibold text-black">Mostrar al cliente</label>
              <p className="text-xs text-black/60">Activar para que el producto sea visible en la tienda</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input name="active" type="checkbox" defaultChecked={active} className="peer sr-only" />
              <div className="peer h-6 w-11 rounded-full bg-[#d9c7b8] peer-checked:bg-primary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[#d9c7b8] after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          <div className="flex gap-3 border-t border-[#e3d7cd] pt-4">
            <Button type="submit" disabled={loading} className="flex-1 bg-primary text-white hover:bg-primary/90">
              {loading ? "Actualizando..." : "Actualizar producto"}
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
