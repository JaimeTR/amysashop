"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";

type Props = {
  images: string[];
  name: string;
};

function isVideoSrc(value: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(?:$|\?)/i.test(String(value || "").trim());
}

export function ProductGallery({ images, name }: Props) {
  const gallery = useMemo(
    () =>
      (images.length > 0 ? images : ["/placeholder-product.svg"]).map((src) => ({
        src,
        kind: isVideoSrc(src) ? ("video" as const) : ("image" as const),
      })),
    [images]
  );
  const [selected, setSelected] = useState(0);

  const activeImage = gallery[selected] || gallery[0];

  return (
    <section className="grid gap-3 lg:grid-cols-[92px_minmax(0,1fr)] lg:items-start">
      <div className="order-2 grid grid-cols-4 gap-2 lg:order-1 lg:grid-cols-1 lg:gap-3">
        {gallery.map((item, index) => (
          <button
            key={`${item.src}-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            className={`relative overflow-hidden rounded-xl border bg-white transition ${
              selected === index
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/40"
            }`}
            aria-label={`Ver foto ${index + 1}`}
          >
            {item.kind === "video" ? (
              <div className="relative h-16 w-full overflow-hidden bg-black/90">
                <video src={item.src} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                <span className="absolute inset-0 grid place-content-center bg-black/20 text-white">
                  <Play className="size-4 fill-white" />
                </span>
              </div>
            ) : (
              <Image
                src={item.src}
                alt={`${name} ${index + 1}`}
                width={240}
                height={240}
                className="h-16 w-full object-cover"
              />
            )}
          </button>
        ))}
      </div>

      <div className="order-1 overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-sm lg:order-2">
        {activeImage.kind === "video" ? (
          <video
            key={activeImage.src}
            src={activeImage.src}
            controls
            playsInline
            preload="metadata"
            className="h-[360px] w-full bg-black object-contain md:h-[460px]"
          />
        ) : (
          <Image
            key={activeImage.src}
            src={activeImage.src}
            alt={name}
            width={1200}
            height={1200}
            className="h-[360px] w-full object-cover md:h-[460px]"
          />
        )}
      </div>
    </section>
  );
}
