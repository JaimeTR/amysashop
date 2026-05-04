"use client";

import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "#AE826D" }}>
      <div className="flex flex-col items-center gap-6">
        <div className="w-36 h-36 flex items-center justify-center">
          <Image
            src="/logos/LOGO%20CLARO%20AMYSA%20SHOP.png"
            alt="AMYSA"
            width={160}
            height={160}
            className="object-contain filter drop-shadow-lg"
            priority
          />
        </div>
        <div className="text-center text-white">
          <h2 className="text-2xl font-semibold">Bienvenid@</h2>
          <p className="mt-1 text-sm">Disfruta de tu compra segura</p>
        </div>
      </div>
    </div>
  );
}
