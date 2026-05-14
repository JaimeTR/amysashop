"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/components/feedback/notification-center";

type ClientRow = {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  direccion: string;
};

type Props = {
  client: ClientRow;
  updateClientDataAction: (formData: FormData) => Promise<void>;
  className?: string;
};

export function ClientEditModal({ client, updateClientDataAction, className }: Props) {
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
      formData.set("userId", client.id);
      await updateClientDataAction(formData);

      notify.success("Cliente actualizado", "Los datos del cliente se han guardado correctamente");
      setOpen(false);
      router.refresh();
    } catch (error) {
      notify.error(
        "Error al actualizar",
        error instanceof Error ? error.message : "No se pudo actualizar el cliente"
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
            <h2 className="font-[var(--font-display)] text-3xl text-black">Editar cliente</h2>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="client-edit-email" className="mb-1 block text-xs font-semibold text-black">Correo</label>
            <input id="client-edit-email" value={client.email || ""} disabled className={`${baseInputClass} cursor-not-allowed bg-[#f6f2ee] text-black/70`} />
            <p className="mt-1 text-[11px] text-black/55">El correo se mantiene desde autenticación.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="client-edit-nombre" className="mb-1 block text-xs font-semibold text-black">Nombre completo</label>
              <input id="client-edit-nombre" name="nombre" defaultValue={client.nombre || ""} required className={baseInputClass} />
            </div>
            <div>
              <label htmlFor="client-edit-telefono" className="mb-1 block text-xs font-semibold text-black">Teléfono</label>
              <input id="client-edit-telefono" name="telefono" defaultValue={client.telefono || ""} className={baseInputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="client-edit-direccion" className="mb-1 block text-xs font-semibold text-black">Dirección</label>
            <input id="client-edit-direccion" name="direccion" defaultValue={client.direccion || ""} className={baseInputClass} />
          </div>

          <div className="flex gap-3 border-t border-[#e3d7cd] pt-4">
            <Button type="submit" disabled={loading} className="flex-1 bg-primary text-white hover:bg-primary/90">
              {loading ? "Actualizando..." : "Actualizar cliente"}
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
      <Button 
        type="button" 
        size="icon" 
        variant="outline" 
        onClick={() => setOpen(true)}
        className={className}
        title="Editar cliente"
      >
        <Pencil className="size-3 sm:size-4" />
      </Button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
