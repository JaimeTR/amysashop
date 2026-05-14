"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/components/feedback/notification-center";

type Props = {
  createClientAction: (formData: FormData) => Promise<void>;
};

export function ClientCreateModal({ createClientAction }: Props) {
  const router = useRouter();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const baseInputClass =
    "w-full h-10 rounded-lg border border-[#e3d7cd] bg-white/95 px-3 text-sm text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-primary/25";

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      await createClientAction(formData);

      notify.success("Cliente creado", "El nuevo cliente se ha registrado correctamente");
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 500);
    } catch (error) {
      notify.error(
        "Error al crear cliente",
        error instanceof Error ? error.message : "No se pudo crear el cliente"
      );
    } finally {
      setLoading(false);
    }
  }

  const modalContent = open ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Registro</p>
            <h2 className="font-[var(--font-display)] text-3xl text-black">Nuevo cliente</h2>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="client-create-email" className="mb-1 block text-xs font-semibold text-black">Correo</label>
              <input
                id="client-create-email"
                name="email"
                type="email"
                placeholder="correo@cliente.com"
                required
                className={baseInputClass}
              />
            </div>
            <div>
              <label htmlFor="client-create-nombre" className="mb-1 block text-xs font-semibold text-black">Nombre completo</label>
              <input
                id="client-create-nombre"
                name="nombre"
                placeholder="Nombre completo"
                required
                className={baseInputClass}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="client-create-telefono" className="mb-1 block text-xs font-semibold text-black">Teléfono</label>
              <input
                id="client-create-telefono"
                name="telefono"
                placeholder="Teléfono"
                className={baseInputClass}
              />
            </div>
            <div>
              <label htmlFor="client-create-direccion" className="mb-1 block text-xs font-semibold text-black">Dirección</label>
              <input
                id="client-create-direccion"
                name="direccion"
                placeholder="Dirección"
                className={baseInputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="client-create-tempPassword" className="mb-1 block text-xs font-semibold text-black">Clave temporal (opcional)</label>
            <input
              id="client-create-tempPassword"
              name="tempPassword"
              placeholder="Si lo dejas vacío se genera automáticamente"
              className={baseInputClass}
            />
          </div>

          <p className="text-xs text-black/60">
            Si no defines una clave temporal, se genera una automáticamente.
          </p>

          <div className="flex gap-3 border-t border-[#e3d7cd] pt-4">
            <Button type="submit" disabled={loading} className="flex-1 bg-primary text-white hover:bg-primary/90">
              {loading ? "Guardando..." : "Guardar cliente"}
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
    </div>
  ) : null;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="bg-primary text-white hover:bg-primary/90">
        Crear nuevo cliente
      </Button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
