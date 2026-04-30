"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type UserRow = {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  direccion: string;
};

type Props = {
  user: UserRow;
  updateUserDataAction: (formData: FormData) => Promise<void>;
};

export function UserEditModal({ user, updateUserDataAction }: Props) {
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
      formData.set("userId", user.id);
      await updateUserDataAction(formData);

      setNotification({ type: "success", message: "Usuario actualizado correctamente" });

      setTimeout(() => {
        setOpen(false);
        setNotification(null);
        router.refresh();
      }, 900);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo actualizar el usuario",
      });
      setTimeout(() => setNotification(null), 2500);
    } finally {
      setLoading(false);
    }
  }

  const modalContent = open ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
        {notification ? (
          <div
            className={`mb-4 rounded-lg p-3 text-sm font-medium ${
              notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        ) : null}

        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Registro</p>
            <h2 className="font-[var(--font-display)] text-3xl text-black">Editar usuario</h2>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-black">Correo</label>
            <input value={user.email || ""} disabled className={`${baseInputClass} cursor-not-allowed bg-[#f6f2ee] text-black/70`} />
            <p className="mt-1 text-[11px] text-black/55">El correo se mantiene desde autenticacion.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Nombre completo</label>
              <input name="nombre" defaultValue={user.nombre || ""} required className={baseInputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-black">Telefono</label>
              <input name="telefono" defaultValue={user.telefono || ""} className={baseInputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-black">Direccion</label>
            <input name="direccion" defaultValue={user.direccion || ""} className={baseInputClass} />
          </div>

          <div className="flex gap-3 border-t border-[#e3d7cd] pt-4">
            <Button type="submit" disabled={loading} className="flex-1 bg-primary text-white hover:bg-primary/90">
              {loading ? "Actualizando..." : "Actualizar usuario"}
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
      <Button type="button" size="icon" variant="outline" onClick={() => setOpen(true)} className="size-8" title="Editar usuario">
        <Pencil className="size-4" />
      </Button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
