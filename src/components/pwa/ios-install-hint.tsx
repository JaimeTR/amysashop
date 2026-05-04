"use client";

import { useEffect, useState } from "react";

export default function IosInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("amysa_ios_install_dismissed");
      if (dismissed) return;

      const ua = navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(ua);
      const isInStandalone = (window as any).navigator?.standalone === true || window.matchMedia("(display-mode: standalone)")?.matches;

      if (isIos && !isInStandalone) {
        setShow(true);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[1000] w-[min(920px,calc(100%-32px))] -translate-x-1/2 rounded-2xl px-4 py-3 shadow-lg" style={{ backgroundColor: "#AE826D" }}>
      <div className="flex items-center gap-3 text-white">
        <img src="/logos/LOGO%20CLARO%20AMYSA%20SHOP.png" alt="AMYSA" className="h-10 w-10 object-contain" />
        <div className="flex-1 text-sm">
          <div className="font-semibold">Instalar AMYSA</div>
          <div className="mt-0.5">Pulsa compartir y selecciona &quot;Agregar a pantalla de inicio&quot; en Safari.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md bg-white/10 px-3 py-1 text-sm text-white"
            onClick={() => {
              localStorage.setItem("amysa_ios_install_dismissed", "1");
              setShow(false);
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
