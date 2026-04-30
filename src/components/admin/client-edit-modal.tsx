"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
};

export function ClientEditModal({ client, updateClientDataAction }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

      setNotification({ type: "success", message: "Cliente actualizado correctamente" });

      setTimeout(() => {
        setOpen(false);
        setNotification(null);
        router.refresh();
      }, 900);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo actualizar el cliente",
      });
      setTimeout(() => setNotification(null), 2500);
    } finally {
      setLoading(false);
    }
  }

  const modalContent = open ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
        {notification && (
          <div
            className={`mb-4 rounded-lg p-3 text-sm font-medium ${
              notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        )}

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
            <label className="mb-1 block text-xs font-semibold text-black">Correo</label>
            <input value={client.email || ""} disabled className={`${baseInputClass} cursor-not-allowed bg-[#f6f2ee] text-black/70`} />
            <p className="mt-1 text-[11px] text-black/55">El correo se mantiene desde autenticación.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Nombre completo</label>
              <input name="nombre" defaultValue={client.nombre || ""} required className={baseInputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Teléfono</label>
              <input name="telefono" defaultValue={client.telefono || ""} className={baseInputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-black">Dirección</label>
            <input name="direccion" defaultValue={client.direccion || ""} className={baseInputClass} />
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
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="mr-1 size-3.5" />
        Editar
      </Button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
