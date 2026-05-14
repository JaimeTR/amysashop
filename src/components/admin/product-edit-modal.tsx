"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canonicalizeBrandName } from "@/lib/brands";
import { useRegisteredTaxonomies } from "@/lib/use-registered-taxonomies";
import { useNotify } from "@/components/feedback/notification-center";

type Props = {
  productId: string;
  name: string;
  code: string;
  gender: string;
  ageGroup: string;
  category: string;
  subCategory?: string;
  categories: string[];
  brand: string;
  subBrand?: string;
  brands: string[];
  subBrands?: Array<{ name: string; brand: string }>;
  subCategories?: Array<{ name: string; category: string }>;
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
  className?: string;
};

export function ProductEditModal({
  productId,
  name,
  code,
  gender,
  ageGroup,
  category,
  subCategory,
  categories,
  brand,
  subBrand,
  brands,
  subBrands,
  subCategories,
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
  className,
}: Props) {
  const isVideoMedia = (value: string) => /\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(String(value || "").trim());
  const firstImage = images.find((item) => item && !isVideoMedia(item)) || "";
  const galleryItems = images.filter((item) => item && item !== firstImage);

  const parseMediaList = (value: string) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const router = useRouter();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mainImageUrls, setMainImageUrls] = useState(firstImage);
  const [galleryImageUrls, setGalleryImageUrls] = useState(galleryItems.join(", "));
  const [mainUploadedFiles, setMainUploadedFiles] = useState<File[]>([]);
  const [galleryUploadedFiles, setGalleryUploadedFiles] = useState<File[]>([]);
  const [mainPreviewUrl, setMainPreviewUrl] = useState<string>(firstImage);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>(galleryItems);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const { genderOptions, ageGroupOptions } = useRegisteredTaxonomies();

  const [selectedCategory, setSelectedCategory] = useState<string>(category || "");
  const [selectedBrand, setSelectedBrand] = useState<string>(brand || "");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(subCategory || "");
  const [selectedSubBrand, setSelectedSubBrand] = useState<string>(subBrand || "");

    function normalizeLabel(value: string) {
      return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

    const availableSubCategories = useMemo(() => {
      if (!selectedCategory || !Array.isArray(subCategories)) return [] as string[];

      const selectedKey = normalizeLabel(selectedCategory);
      const seen = new Map<string, string>();

      for (const item of subCategories) {
        const categoryKey = normalizeLabel(item.category);
        const name = String(item.name || "").trim();
        if (!name || categoryKey !== selectedKey) continue;
        const key = normalizeLabel(name);
        if (!seen.has(key)) seen.set(key, name);
      }

      return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
    }, [selectedCategory, subCategories]);

    const availableSubBrands = useMemo(() => {
      if (!selectedBrand || !Array.isArray(subBrands)) return [] as string[];

      const canonicalBrand = canonicalizeBrandName(selectedBrand) || selectedBrand;
      const selectedKey = normalizeLabel(canonicalBrand);
      const seen = new Map<string, string>();

      for (const item of subBrands) {
        const itemBrand = canonicalizeBrandName(item.brand) || item.brand;
        const brandKey = normalizeLabel(itemBrand);
        const name = String(item.name || "").trim();
        if (!name || brandKey !== selectedKey) continue;
        const key = normalizeLabel(name);
        if (!seen.has(key)) seen.set(key, name);
      }

      return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "es"));
    }, [selectedBrand, subBrands]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedCategory(category || "");
    setSelectedBrand(brand || "");
    setSelectedSubCategory(subCategory || "");
    setSelectedSubBrand(subBrand || "");
    setMainImageUrls(firstImage);
    setGalleryImageUrls(galleryItems.join(", "));
    setMainPreviewUrl(firstImage);
    setGalleryPreviewUrls(galleryItems);
  }, [open, category, brand, subCategory, subBrand]);

  useEffect(() => {
    if (mainUploadedFiles.length > 0) {
      const nextUrl = URL.createObjectURL(mainUploadedFiles[0]);
      setMainPreviewUrl(nextUrl);

      return () => URL.revokeObjectURL(nextUrl);
    }

    setMainPreviewUrl(mainImageUrls.trim() || firstImage);
    return undefined;
  }, [mainUploadedFiles, mainImageUrls, firstImage]);

  useEffect(() => {
    const previewUrls = parseMediaList(galleryImageUrls);
    const fileUrls = galleryUploadedFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviewUrls([...previewUrls, ...fileUrls]);

    return () => {
      fileUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [galleryImageUrls, galleryUploadedFiles]);

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

  const removeGalleryPreviewItem = (index: number) => {
    const textItems = parseMediaList(galleryImageUrls);
    const textCount = textItems.length;

    if (index < textCount) {
      textItems.splice(index, 1);
      setGalleryImageUrls(textItems.join(", "));
      return;
    }

    const fileIndex = index - textCount;
    setGalleryUploadedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
  };

  const removeMainPreviewImage = () => {
    setMainImageUrls("");
    setMainUploadedFiles([]);
    if (mainFileInputRef.current) {
      mainFileInputRef.current.value = "";
    }
  };

  const renderPreviewThumbnail = (src: string, alt: string, onRemove: () => void) => (
      <div className="relative overflow-hidden rounded-xl border border-[#e3d7cd] bg-white shadow-sm">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 z-10 inline-flex size-6 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-destructive/10"
        aria-label={`Eliminar ${alt}`}
      >
        <X className="size-3.5" />
      </button>
      <img src={src} alt={alt} className="size-24 object-cover" />
    </div>
  );

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

      notify.success("Producto actualizado", "Los cambios se han guardado correctamente");
      setTimeout(() => {
        setOpen(false);
        setMainUploadedFiles([]);
        setGalleryUploadedFiles([]);
        router.refresh();
      }, 500);
    } catch (error) {
      notify.error(
        "Error al actualizar",
        error instanceof Error ? error.message : "No se pudo actualizar el producto"
      );
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
        className={className}
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
              <label htmlFor="product-edit-name" className="mb-1 block text-xs font-semibold text-black">Nombre</label>
              <input id="product-edit-name" name="name" defaultValue={name} placeholder="Nombre del producto" required className={baseInputClass} />
            </div>
            <div>
              <p className="mb-1 block text-xs font-semibold text-black">SKU generado</p>
              <div className="flex h-10 items-center rounded-lg border border-[#e3d7cd] bg-[#f4eee9] px-3 text-sm font-semibold text-black/75">
                {code || "Sin SKU"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="product-edit-category" className="mb-1 block text-xs font-semibold text-black">Categoría</label>
              <select
                id="product-edit-category"
                name="category"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubCategory("");
                }}
                required
                className={selectInputClass}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product-edit-brand" className="mb-1 block text-xs font-semibold text-black">Marca</label>
              <select
                id="product-edit-brand"
                name="brand"
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedSubBrand("");
                }}
                required
                className={selectInputClass}
              >
                <option value="">Seleccionar marca</option>
                {brands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="product-edit-subCategory" className="mb-1 block text-xs font-semibold text-black">Subcategoría</label>
              <select
                id="product-edit-subCategory"
                name="subCategory"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
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
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product-edit-subBrand" className="mb-1 block text-xs font-semibold text-black">Submarca</label>
              <select
                id="product-edit-subBrand"
                name="subBrand"
                value={selectedSubBrand}
                onChange={(e) => setSelectedSubBrand(e.target.value)}
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
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="gender" className="mb-1 block text-xs font-semibold text-black">Género</label>
              <select id="gender" name="gender" defaultValue={gender} className={selectInputClass}>
                <option value="">Seleccionar género</option>
                {genderOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ageGroup" className="mb-1 block text-xs font-semibold text-black">Edad</label>
              <select id="ageGroup" name="ageGroup" defaultValue={ageGroup} className={selectInputClass}>
                <option value="">Seleccionar edad</option>
                {ageGroupOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="price" className="mb-1 block text-xs font-semibold text-black">Precio actual</label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={price > 0 ? price : ""}
                placeholder="Ej: 29.99"
                required
                className={baseInputClass}
              />
              <p className="mt-1 text-[11px] text-black/55">Precio de venta final (requerido)</p>
            </div>
            <div>
              <label htmlFor="priceBefore" className="mb-1 block text-xs font-semibold text-black">Precio sugerido</label>
              <input id="priceBefore" name="priceBefore" type="number" step="0.01" min="0" defaultValue={priceBefore || ""} placeholder="Referencia visual para marketing" className={baseInputClass} />
            </div>
            <div>
              <label htmlFor="stock" className="mb-1 block text-xs font-semibold text-black">Stock</label>
              <input id="stock" name="stock" type="number" min="0" defaultValue={stock} required className={baseInputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="product-edit-description" className="mb-1 block text-xs font-semibold text-black">Descripción corta</label>
            <textarea
              id="product-edit-description"
              name="description"
              defaultValue={description}
              rows={2}
              className="w-full rounded-lg border border-[#e3d7cd] bg-white/95 px-3 py-2 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-[#e3d7cd] bg-[#fcf8f5] p-4">
            <div className="space-y-2">
              <div>
                <p className="block text-xs font-semibold text-black">Foto principal</p>
                <p className="text-[11px] text-black/60">Esta portada se usa primero en la página del producto y en miniaturas generales.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  id="product-edit-mainImageUrls"
                  type="text"
                  value={mainImageUrls}
                  onChange={(event) => setMainImageUrls(event.target.value)}
                  placeholder="https://ejemplo.com/portada.jpg"
                  className={baseInputClass}
                />
                <div className="relative">
                  <input
                    id="main-file"
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

              {mainPreviewUrl ? (
                <div className="flex flex-wrap gap-3">
                  {renderPreviewThumbnail(mainPreviewUrl, "Foto principal", removeMainPreviewImage)}
                </div>
              ) : null}
            </div>

              <div className="space-y-2 border-t border-[#e3d7cd] pt-4">
              <div>
                <p className="block text-xs font-semibold text-black">Galería de fotos o videos</p>
                <p className="text-[11px] text-black/60">Estos elementos se mostrarán en el detalle del producto como miniaturas.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  id="product-edit-galleryImageUrls"
                  type="text"
                  value={galleryImageUrls}
                  onChange={(event) => setGalleryImageUrls(event.target.value)}
                  placeholder="https://ejemplo.com/foto2.jpg, https://ejemplo.com/video.mp4"
                  className={baseInputClass}
                />
                <div className="relative">
                  <input
                    id="product-edit-gallery-file"
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

              {galleryPreviewUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {galleryPreviewUrls.map((src, index) => {
                    const isUploadedFile = index >= parseMediaList(galleryImageUrls).length;
                    const uploadedIndex = index - parseMediaList(galleryImageUrls).length;
                    const alt = isUploadedFile ? `Galería ${uploadedIndex + 1}` : `Galería ${index + 1}`;

                    return (
                      <div key={`${src}-${index}`} className="relative overflow-hidden rounded-xl border border-[#e3d7cd] bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => removeGalleryPreviewItem(index)}
                            className="absolute right-1 top-1 z-10 inline-flex size-6 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-destructive/10"
                            aria-label={`Eliminar ${alt}`}
                          >
                          <X className="size-3.5" />
                        </button>
                        <img src={src} alt={alt} className="h-24 w-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-[#e3d7cd] bg-[#fcf8f5] p-3">
            <div className="flex-1">
              <div className="text-sm font-semibold text-black">Mostrar al cliente</div>
              <p className="text-xs text-black/60">Activar para que el producto sea visible en la tienda</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center" aria-label="Mostrar producto al cliente">
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
