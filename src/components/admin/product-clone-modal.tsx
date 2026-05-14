"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/components/feedback/notification-center";

type Props = {
  productId: string;
  name: string;
  code: string;
  category: string;
  categories: string[];
  brand: string;
  brands: string[];
  subBrands?: string[];
  subCategories?: string[];
  price: number;
  priceBefore: number | null;
  stock: number;
  description: string;
  images: string[];
  active: boolean;
  cloneProductAction: (formData: FormData) => Promise<void>;
  triggerMode?: "text" | "icon";
  triggerIcon?: React.ReactNode;
  triggerAriaLabel?: string;
};

export function ProductCloneModal({
  productId,
  name,
  code,
  category,
  categories,
  brand,
  brands,
  subBrands,
  subCategories,
  price,
  priceBefore,
  stock,
  description,
  images,
  active,
  cloneProductAction,
  triggerMode = "text",
  triggerIcon,
  triggerAriaLabel,
}: Props) {
  const router = useRouter();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const mainImageUrls = images.find((item) => item && !/\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(item)) || "";
  const [galleryImageUrls, setGalleryImageUrls] = useState(images.filter((item) => item !== mainImageUrls).join(", "));
  const [mainUploadedFiles, setMainUploadedFiles] = useState<File[]>([]);
  const [galleryUploadedFiles, setGalleryUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: `${name} (Clon)`,
    code: "",
    category,
    brand,
    
    price,
    priceBefore: priceBefore?.toString() || "",
    stock,
    description,
    active,
  });

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
      const data = new FormData(event.currentTarget);
      data.set("originProductId", productId);

      galleryUploadedFiles.forEach((file) => {
        data.append("galleryFiles", file);
      });

      mainUploadedFiles.forEach((file) => {
        data.append("mainFiles", file);
      });

      if (mainImageUrls.trim()) {
        data.set("mainImageUrls", mainImageUrls);
      }

      if (galleryImageUrls.trim()) {
        data.set("galleryImageUrls", galleryImageUrls);
      }

      await cloneProductAction(data);
      notify.success("Producto clonado", "El producto se ha duplicado correctamente");

      setTimeout(() => {
        setOpen(false);
        setMainUploadedFiles([]);
        setGalleryUploadedFiles([]);
        router.refresh();
      }, 500);
    } catch (error) {
      notify.error(
        "Error al clonar",
        error instanceof Error ? error.message : "No se pudo clonar el producto"
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
        aria-label={triggerAriaLabel || "Clonar"}
      >
        {triggerMode === "icon" ? triggerIcon || "C" : "Clonar"}
      </Button>

      {open && mounted
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/50 bg-[#fcf8f5] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <div className="flex items-center justify-between border-b border-[#e3d7cd] pb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Clonar Producto</p>
                    <h2 className="font-[var(--font-display)] text-2xl text-foreground">Edita antes de guardar</h2>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    aria-label="Cerrar"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="product-clone-name" className="text-xs font-semibold uppercase">Nombre</label>
                    <input
                      id="product-clone-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={baseInputClass}
                      required
                    />
                  </div>

                    <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="product-clone-code" className="text-xs font-semibold uppercase">Código</label>
                      <input
                        id="product-clone-code"
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={baseInputClass}
                        placeholder="Se generará automáticamente"
                      />
                    </div>
                    <div>
                      <label htmlFor="product-clone-brand" className="text-xs font-semibold uppercase">Marca</label>
                      <select
                        id="product-clone-brand"
                        name="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className={selectInputClass}
                        required
                      >
                        <option value="">Selecciona marca</option>
                        {brands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                    <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="product-clone-category" className="text-xs font-semibold uppercase">Categoría</label>
                      <select
                        id="product-clone-category"
                        name="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={selectInputClass}
                        required
                      >
                        <option value="">Selecciona categoría</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div />
                  </div>

                  <div className="space-y-4 rounded-2xl border border-[#e3d7cd] bg-white/40 p-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase">Foto principal</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          id="product-clone-mainImageUrls"
                          type="text"
                          name="mainImageUrls"
                          defaultValue={mainImageUrls}
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
                            <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border border-[#e3d7cd] bg-white px-3 py-2">
                              <span className="text-sm">{file.name}</span>
                              <button type="button" onClick={() => removeMainUploadedFile(index)} className="text-destructive-foreground hover:text-destructive-foreground/80">
                                <X className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2 border-t border-[#e3d7cd] pt-4">
                      <p className="text-xs font-semibold uppercase">Galería de fotos o videos</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          id="product-clone-galleryImageUrls"
                          type="text"
                          name="galleryImageUrls"
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
                          <div className="flex h-10 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/35 bg-[#fcf8f5] px-2">
                            <Upload className="size-4 text-primary" />
                            <span className="text-xs text-black/70">Subir galería</span>
                          </div>
                        </div>
                      </div>

                      {galleryUploadedFiles.length > 0 ? (
                        <div className="space-y-1">
                          {galleryUploadedFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border border-[#e3d7cd] bg-white px-3 py-2">
                              <span className="text-sm">{file.name}</span>
                              <button type="button" onClick={() => removeGalleryUploadedFile(index)} className="text-destructive-foreground hover:text-destructive-foreground/80">
                                <X className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="product-clone-price" className="text-xs font-semibold uppercase">Precio</label>
                      <input
                        id="product-clone-price"
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        step="0.01"
                        min="0"
                        className={baseInputClass}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="priceBefore" className="text-xs font-semibold uppercase">Precio Sugerido</label>
                      <input
                        id="priceBefore"
                        type="number"
                        name="priceBefore"
                        value={formData.priceBefore}
                        onChange={(e) => setFormData({ ...formData, priceBefore: e.target.value })}
                        step="0.01"
                        min="0"
                        placeholder="Opcional"
                        className={baseInputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="stock" className="text-xs font-semibold uppercase">Stock</label>
                    <input
                      id="stock"
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      min="0"
                      className={baseInputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="text-xs font-semibold uppercase">Descripción</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`${baseInputClass} min-h-[100px] resize-none`}
                    />
                  </div>

                  <label htmlFor="active" className="flex items-center gap-2 pt-2">
                    <input
                      id="active"
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="size-4 rounded border-input"
                    />
                    <span className="text-sm">Visible en tienda</span>
                  </label>
                </div>

                <div className="flex gap-2 border-t border-[#e3d7cd] pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Clonando..." : "Clonar Producto"}
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
