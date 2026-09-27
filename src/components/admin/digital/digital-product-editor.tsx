"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, FileUp, ImagePlus, Loader2, Save, Trash2, Upload } from "lucide-react";
import {
  createDigitalUploadUrlAction,
  deleteDigitalFileAction,
  deleteDigitalProductAction,
  deletePublicImageAction,
  registerDigitalFileAction,
  saveDigitalProductAction,
  updateDigitalFileAction,
  type DigitalProductInput,
} from "@/app/admin/digitales/actions";
import { useNotify } from "@/components/feedback/notification-center";
import { compressImageFile } from "@/lib/image-compression";
import {
  DIGITAL_FILE_KIND_LABELS,
  DIGITAL_MAX_FILE_BYTES,
  DIGITAL_MAX_IMAGE_BYTES,
  DIGITAL_PRODUCT_TYPES,
  formatFileSize,
  getDigitalFileKind,
  slugifyDigital,
  type DigitalFileInfo,
  type DigitalProduct,
  type DigitalProductType,
} from "@/lib/digital-types";
import { isOptimizableImageSrc } from "@/lib/product-images";
import { createClient } from "@/lib/supabase/client";

type EditorProduct = DigitalProduct & {
  files: Array<DigitalFileInfo & { storagePath: string }>;
  packProductIds: string[];
};

type Props = {
  product: EditorProduct | null;
  packCandidates: Array<{ id: string; name: string }>;
};

const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2";
const labelClass = "space-y-1 text-sm";
const sectionClass = "glass-card space-y-4 rounded-3xl p-5";

export function DigitalProductEditor({ product, packCandidates }: Props) {
  const router = useRouter();
  const notify = useNotify();
  const supabase = useMemo(() => createClient(), []);
  const isNew = !product;

  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [subtitle, setSubtitle] = useState(product?.subtitle || "");
  const [description, setDescription] = useState(product?.description || "");
  const [productType, setProductType] = useState<DigitalProductType>(product?.productType || "plantilla");
  const [featuresText, setFeaturesText] = useState((product?.features || []).join("\n"));
  const [idealFor, setIdealFor] = useState(product?.idealFor || "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [priceBefore, setPriceBefore] = useState(product?.priceBefore != null ? String(product.priceBefore) : "");
  const [coverUrl, setCoverUrl] = useState<string | null>(product?.coverUrl || null);
  const [previewImages, setPreviewImages] = useState<string[]>(product?.previewImages || []);
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(String(product?.sortOrder ?? 0));
  const [packProductIds, setPackProductIds] = useState<string[]>(product?.packProductIds || []);
  const [files, setFiles] = useState(product?.files || []);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const previewInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);

  function buildInput(overrides: Partial<DigitalProductInput> = {}): DigitalProductInput {
    return {
      id: product?.id,
      name,
      slug: slug || slugifyDigital(name),
      subtitle,
      description,
      productType,
      features: featuresText.split("\n"),
      idealFor,
      price: Number(price || 0),
      priceBefore: priceBefore ? Number(priceBefore) : null,
      coverUrl,
      previewImages,
      active,
      featured,
      sortOrder: Number(sortOrder || 0),
      packProductIds,
      ...overrides,
    };
  }

  async function save(overrides: Partial<DigitalProductInput> = {}, silent = false) {
    setSaving(true);
    const result = await saveDigitalProductAction(buildInput(overrides));
    setSaving(false);

    if (!result.ok) {
      notify.error("No se pudo guardar", result.error);
      return false;
    }
    if (isNew && result.data) {
      notify.success("Producto creado", "Ahora sube la portada, la vista previa y los archivos.");
      router.replace(`/admin/digitales/${result.data.id}`);
      return true;
    }
    if (!silent) notify.success("Cambios guardados", "El producto se actualizó en la tienda.");
    router.refresh();
    return true;
  }

  // Sube un archivo directo a Supabase con una URL firmada generada por el servidor.
  async function uploadToStorage(file: File, bucket: "files" | "public") {
    if (!product) throw new Error("Guarda el producto antes de subir archivos");
    const prepared = await createDigitalUploadUrlAction({ productId: product.id, bucket, fileName: file.name });
    if (!prepared.ok || !prepared.data) throw new Error(prepared.ok ? "No se pudo preparar la subida" : prepared.error);

    const { error } = await supabase.storage
      .from(prepared.data.bucket)
      .uploadToSignedUrl(prepared.data.path, prepared.data.token, file, { contentType: file.type || "application/octet-stream" });
    if (error) throw new Error(error.message);
    return prepared.data;
  }

  async function prepareImage(file: File) {
    const compressed = file.type === "image/gif" ? file : await compressImageFile(file, 1600, 1600, 0.85);
    if (compressed.size > DIGITAL_MAX_IMAGE_BYTES) throw new Error(`${file.name}: la imagen supera 10 MB`);
    return compressed;
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading("Subiendo portada...");
    try {
      const uploaded = await uploadToStorage(await prepareImage(file), "public");
      const previous = coverUrl;
      setCoverUrl(uploaded.publicUrl);
      await save({ coverUrl: uploaded.publicUrl }, true);
      if (previous) void deletePublicImageAction(previous);
      notify.success("Portada actualizada", "");
    } catch (error) {
      notify.error("No se pudo subir la portada", error instanceof Error ? error.message : "");
    } finally {
      setUploading(null);
    }
  }

  async function handlePreviewChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (selected.length === 0) return;
    const added: string[] = [];
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        setUploading(`Subiendo vista previa ${index + 1} de ${selected.length}...`);
        const uploaded = await uploadToStorage(await prepareImage(file), "public");
        if (uploaded.publicUrl) added.push(uploaded.publicUrl);
      }
    } catch (error) {
      notify.error("Error al subir imágenes", error instanceof Error ? error.message : "");
    }
    if (added.length > 0) {
      const next = [...previewImages, ...added];
      setPreviewImages(next);
      await save({ previewImages: next }, true);
      notify.success("Vista previa actualizada", `${added.length} imagen(es) agregadas.`);
    }
    setUploading(null);
  }

  async function movePreview(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= previewImages.length) return;
    const next = [...previewImages];
    [next[index], next[target]] = [next[target], next[index]];
    setPreviewImages(next);
    await save({ previewImages: next }, true);
  }

  async function removePreview(url: string) {
    const next = previewImages.filter((item) => item !== url);
    setPreviewImages(next);
    await save({ previewImages: next }, true);
    void deletePublicImageAction(url);
  }

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (selected.length === 0 || !product) return;

    let uploadedCount = 0;
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      if (file.size > DIGITAL_MAX_FILE_BYTES) {
        notify.error("Archivo muy grande", `${file.name} pesa ${formatFileSize(file.size)}; el máximo es 50 MB. Comprímelo en ZIP o divídelo.`);
        continue;
      }
      setUploading(`Subiendo ${file.name} (${index + 1} de ${selected.length}, ${formatFileSize(file.size)})...`);
      try {
        const uploaded = await uploadToStorage(file, "files");
        const registered = await registerDigitalFileAction({
          productId: product.id,
          name: file.name,
          storagePath: uploaded.path,
          mimeType: file.type,
          sizeBytes: file.size,
        });
        if (!registered.ok) throw new Error(registered.error);
        setFiles((current) => [
          ...current,
          {
            id: registered.data!.id,
            productId: product.id,
            name: file.name,
            description: null,
            mimeType: file.type,
            sizeBytes: file.size,
            sortOrder: current.length + 1,
            storagePath: uploaded.path,
          },
        ]);
        uploadedCount += 1;
      } catch (error) {
        notify.error(`No se pudo subir ${file.name}`, error instanceof Error ? error.message : "");
      }
    }
    setUploading(null);
    if (uploadedCount > 0) {
      notify.success("Archivos subidos", `${uploadedCount} archivo(s) listos para la venta.`);
      router.refresh();
    }
  }

  async function saveFile(file: EditorProduct["files"][number]) {
    const result = await updateDigitalFileAction({ id: file.id, name: file.name, description: file.description || "", sortOrder: file.sortOrder });
    if (!result.ok) notify.error("No se pudo guardar el archivo", result.error);
  }

  async function removeFile(fileId: string, fileName: string) {
    if (!window.confirm(`¿Eliminar "${fileName}"? Los compradores ya no podrán descargarlo.`)) return;
    const result = await deleteDigitalFileAction(fileId);
    if (!result.ok) return notify.error("No se pudo eliminar", result.error);
    setFiles((current) => current.filter((file) => file.id !== fileId));
    router.refresh();
  }

  async function removeProduct() {
    if (!product || !window.confirm(`¿Eliminar "${product.name}"? Si ya tiene ventas, solo se ocultará.`)) return;
    const result = await deleteDigitalProductAction(product.id);
    if (!result.ok) return notify.error("No se pudo eliminar", result.error);
    notify.success(result.data?.deactivated ? "Producto ocultado" : "Producto eliminado", result.data?.deactivated ? "Tiene ventas: se ocultó de la tienda para no afectar a sus compradores." : "");
    router.push("/admin/digitales");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <header className="glass-card flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl">{isNew ? "Nuevo producto digital" : product.name}</h1>
          {!isNew ? (
            <Link href={`/digital/${product.slug}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Ver página pública <ExternalLink className="size-3.5" />
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Completa los datos y guarda; luego podrás subir la portada, la vista previa y los archivos.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew ? (
            <button type="button" onClick={removeProduct} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-sm font-semibold text-destructive">
              <Trash2 className="size-4" /> Eliminar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isNew ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </header>

      {uploading ? (
        <div className="sticky top-2 z-20 flex items-center gap-2 rounded-2xl border border-primary/30 bg-white px-4 py-3 text-sm font-medium shadow-lg">
          <Loader2 className="size-4 animate-spin text-primary" /> {uploading}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className={sectionClass}>
            <h2 className="text-lg font-semibold">Información</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                <span className="font-semibold">Nombre *</span>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (!slugTouched) setSlug(slugifyDigital(event.target.value));
                  }}
                  placeholder="Ej: Libro Emprende desde casa"
                />
              </label>
              <label className={labelClass}>
                <span className="font-semibold">Tipo</span>
                <select className={inputClass} value={productType} onChange={(event) => setProductType(event.target.value as DigitalProductType)}>
                  {(Object.keys(DIGITAL_PRODUCT_TYPES) as DigitalProductType[]).map((type) => (
                    <option key={type} value={type}>
                      {DIGITAL_PRODUCT_TYPES[type].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className="font-semibold">Enlace (slug)</span>
                <div className="flex items-center rounded-lg border border-input bg-background text-sm">
                  <span className="pl-3 text-muted-foreground">/digital/</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(slugifyDigital(event.target.value));
                    }}
                  />
                </div>
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                <span className="font-semibold">Subtítulo</span>
                <input className={inputClass} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Ej: Plantilla de Excel · Nivel básico" />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                <span className="font-semibold">Descripción</span>
                <textarea className={`${inputClass} min-h-28`} value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                <span className="font-semibold">¿Qué incluye? (una línea por punto)</span>
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={featuresText}
                  onChange={(event) => setFeaturesText(event.target.value)}
                  placeholder={"120 páginas\nEjercicios prácticos\nPlantillas descargables"}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                <span className="font-semibold">Ideal para</span>
                <input className={inputClass} value={idealFor} onChange={(event) => setIdealFor(event.target.value)} />
              </label>
            </div>
          </section>

          {productType === "pack" ? (
            <section className={sectionClass}>
              <div>
                <h2 className="text-lg font-semibold">Productos del pack</h2>
                <p className="text-sm text-muted-foreground">Quien compre el pack recibe los archivos de cada producto marcado (y los que subas abajo).</p>
              </div>
              {packCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Primero crea los productos que formarán el pack.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {packCandidates.map((candidate) => (
                    <label key={candidate.id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/70 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={packProductIds.includes(candidate.id)}
                        onChange={(event) =>
                          setPackProductIds((current) =>
                            event.target.checked ? [...current, candidate.id] : current.filter((id) => id !== candidate.id)
                          )
                        }
                      />
                      {candidate.name}
                    </label>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <section className={sectionClass}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Archivos que recibe el comprador</h2>
                <p className="text-sm text-muted-foreground">PDF, Excel, Word, PowerPoint, ZIP, video… hasta 50 MB por archivo. Son privados.</p>
              </div>
              <button
                type="button"
                disabled={isNew || Boolean(uploading)}
                onClick={() => filesInput.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <FileUp className="size-4" /> Subir archivos
              </button>
              <input ref={filesInput} type="file" multiple className="hidden" onChange={handleFilesChange} />
            </div>

            {isNew ? (
              <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">Guarda el producto para habilitar la subida de archivos.</p>
            ) : files.length === 0 ? (
              <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                {productType === "pack" ? "Opcional: el pack ya entrega los archivos de sus productos." : "Aún no hay archivos. Sube lo que recibirá el comprador."}
              </p>
            ) : (
              <ul className="space-y-2">
                {files.map((file) => {
                  const kind = getDigitalFileKind(file.name, file.mimeType);
                  return (
                    <li key={file.id} className="grid gap-2 rounded-xl border border-border/60 bg-white/70 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                      <input
                        className={inputClass}
                        value={file.name}
                        onChange={(event) => setFiles((current) => current.map((item) => (item.id === file.id ? { ...item, name: event.target.value } : item)))}
                        onBlur={() => void saveFile(file)}
                        aria-label="Nombre del archivo"
                      />
                      <input
                        className={inputClass}
                        value={file.description || ""}
                        placeholder="Descripción (opcional)"
                        onChange={(event) =>
                          setFiles((current) => current.map((item) => (item.id === file.id ? { ...item, description: event.target.value } : item)))
                        }
                        onBlur={() => void saveFile(file)}
                        aria-label="Descripción del archivo"
                      />
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {DIGITAL_FILE_KIND_LABELS[kind]}
                          {file.sizeBytes ? ` · ${formatFileSize(file.sizeBytes)}` : ""}
                          {file.storagePath.startsWith("local:") ? " · incluido" : ""}
                        </span>
                        <button type="button" onClick={() => void removeFile(file.id, file.name)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10" aria-label="Eliminar archivo">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className={sectionClass}>
            <h2 className="text-lg font-semibold">Precio y publicación</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className="font-semibold">Precio (S/) *</span>
                <input className={inputClass} type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
              </label>
              <label className={labelClass}>
                <span className="font-semibold">Precio antes</span>
                <input className={inputClass} type="number" min="0" step="0.01" value={priceBefore} onChange={(event) => setPriceBefore(event.target.value)} placeholder="Opcional" />
              </label>
              <label className={labelClass}>
                <span className="font-semibold">Orden</span>
                <input className={inputClass} type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Publicado en la tienda
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /> Destacado (aparece primero y en el inicio)
            </label>
          </section>

          <section className={sectionClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Portada</h2>
              <button
                type="button"
                disabled={isNew || Boolean(uploading)}
                onClick={() => coverInput.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                <Upload className="size-3.5" /> {coverUrl ? "Cambiar" : "Subir"}
              </button>
              <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </div>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[240px] overflow-hidden rounded-2xl bg-muted">
              {coverUrl ? (
                <Image src={coverUrl} alt="Portada" fill sizes="240px" unoptimized={!isOptimizableImageSrc(coverUrl)} className="object-cover" />
              ) : (
                <p className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                  {isNew ? "Guarda el producto para subir la portada" : "Formato vertical recomendado (4:5), p. ej. 1200 × 1500 px"}
                </p>
              )}
            </div>
          </section>

          <section className={sectionClass}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Vista previa</h2>
                <p className="text-xs text-muted-foreground">Páginas de muestra públicas (capturas del libro, plantilla, etc.).</p>
              </div>
              <button
                type="button"
                disabled={isNew || Boolean(uploading)}
                onClick={() => previewInput.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                <ImagePlus className="size-3.5" /> Agregar
              </button>
              <input ref={previewInput} type="file" accept="image/*" multiple className="hidden" onChange={handlePreviewChange} />
            </div>
            {previewImages.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin imágenes de muestra.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {previewImages.map((url, index) => (
                  <li key={url} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                    <Image src={url} alt={`Vista previa ${index + 1}`} fill sizes="110px" unoptimized={!isOptimizableImageSrc(url)} className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                      <button type="button" onClick={() => void movePreview(index, -1)} className="text-white disabled:opacity-40" disabled={index === 0} aria-label="Mover a la izquierda">
                        <ArrowLeft className="size-4" />
                      </button>
                      <button type="button" onClick={() => void removePreview(url)} className="text-white" aria-label="Eliminar">
                        <Trash2 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void movePreview(index, 1)}
                        className="text-white disabled:opacity-40"
                        disabled={index === previewImages.length - 1}
                        aria-label="Mover a la derecha"
                      >
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
