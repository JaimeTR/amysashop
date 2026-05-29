"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmprendeSaleForm, type EmprendeClientOption, type EmprendeProductOption, type EmprendeSalespersonOption } from "@/components/admin/emprende-sale-form";

type Props = {
  role: "superadmin" | "administrador" | "duena" | "vendedora" | "socia" | "cliente";
  salespeople: EmprendeSalespersonOption[];
  clients: EmprendeClientOption[];
  products: EmprendeProductOption[];
  initialSalespersonId: string;
  initialError?: string | null;
  action: (formData: FormData) => Promise<void>;
};

export function EmprendeSaleModal({
  role,
  salespeople,
  clients,
  products,
  initialSalespersonId,
  initialError,
  action,
}: Props) {
  const [open, setOpen] = useState(Boolean(initialError));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (initialError) {
      setOpen(true);
    }
  }, [initialError]);

  const modalContent = open ? (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/20 bg-[#f7f3ef] p-4 shadow-2xl backdrop-blur-md md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Registro de ventas</p>
            <h2 className="font-[var(--font-display)] text-2xl text-foreground md:text-3xl">Registrar nueva venta</h2>
            <p className="mt-1 text-sm text-muted-foreground">Completa los datos dentro del modal sin salir de la vista administrativa.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} className="shrink-0">
            <X className="size-4" />
          </Button>
        </div>

        <EmprendeSaleForm
          role={role}
          salespeople={salespeople}
          clients={clients}
          products={products}
          initialSalespersonId={initialSalespersonId}
          initialError={initialError}
          action={action}
          onSuccess={() => setOpen(false)}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full justify-center bg-primary text-white hover:bg-primary/90"
      >
        Registrar venta
      </Button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
