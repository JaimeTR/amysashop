"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { isOptimizableImageSrc } from "@/lib/product-images";

// Portada + páginas de muestra. Las imágenes son públicas (bucket digital-public);
// sirven para que el cliente vea el contenido antes de comprar.
export function DigitalPreviewGallery({ name, images }: { name: string; images: string[] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") setActive((index) => (index + 1) % images.length);
      if (event.key === "ArrowLeft") setActive((index) => (index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images.length]);

  if (images.length === 0) return null;
  const current = images[active] || images[0];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/60 bg-white shadow-sm"
        aria-label="Ver en grande"
      >
        <Image
          src={current}
          alt={active === 0 ? name : `${name} - vista previa ${active}`}
          fill
          priority={active === 0}
          sizes="(max-width: 1024px) 100vw, 560px"
          unoptimized={!isOptimizableImageSrc(current)}
          className="object-contain"
        />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white opacity-90">
          <ZoomIn className="size-3.5" /> Ampliar
        </span>
      </button>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition ${
                index === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={index === 0 ? "Portada" : `Vista previa ${index}`}
            >
              <Image src={src} alt="" fill sizes="64px" unoptimized={!isOptimizableImageSrc(src)} className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" onClick={() => setLightbox(false)} role="dialog" aria-modal="true">
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25" aria-label="Cerrar">
            <X className="size-5" />
          </button>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((index) => (index - 1 + images.length) % images.length);
                }}
                className="absolute left-3 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                aria-label="Anterior"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((index) => (index + 1) % images.length);
                }}
                className="absolute right-3 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                aria-label="Siguiente"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          ) : null}
          <div className="relative h-full max-h-[90vh] w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <Image src={current} alt={name} fill sizes="100vw" unoptimized={!isOptimizableImageSrc(current)} className="object-contain" />
          </div>
          <p className="absolute bottom-4 text-xs text-white/80">
            {active + 1} / {images.length}
          </p>
        </div>
      ) : null}
    </div>
  );
}
