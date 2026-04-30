"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  name: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ProductImageZoom({ src, name }: Props) {
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false, px: 0, py: 0, width: 0, height: 0 });

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setZoom({
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
      px: event.clientX - rect.left,
      py: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      active: true,
    });
  }

  function handleLeave() {
    setZoom((prev) => ({ ...prev, active: false }));
  }

  const previewSize = 220;
  const previewLeft = clamp(zoom.px + 18, 8, Math.max(8, zoom.width - previewSize - 8));
  const previewTop = clamp(zoom.py - previewSize / 2, 8, Math.max(8, zoom.height - previewSize - 8));

  return (
    <div
      className="group relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-2xl border border-[#e3d7cd]"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <Image src={src} alt={name} width={1200} height={1200} unoptimized className="h-full w-full object-cover" />

      <div className="pointer-events-none absolute inset-0 border-2 border-white/0 transition group-hover:border-white/40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-3 text-xs font-medium text-white/90">
        Pasa el cursor para ver zoom
      </div>

      {zoom.active ? (
        <div
          className="pointer-events-none absolute z-20 h-[220px] w-[220px] overflow-hidden rounded-xl border border-white/80 bg-white shadow-xl"
          style={{ left: previewLeft, top: previewTop }}
        >
          <Image
            src={src}
            alt={`${name} zoom`}
            width={900}
            height={900}
            unoptimized
            className="h-full w-full object-cover transition-transform duration-150"
            style={{
              transformOrigin: `${zoom.x}% ${zoom.y}%`,
              transform: "scale(2.5)",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
