"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRoleLabel, type AccessRole } from "@/lib/access-control";

type Props = {
  createUserAction: (formData: FormData) => void;
  roles: AccessRole[];
};

export function UserCreateModal({ createUserAction, roles }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function resetAvatarDraft() {
    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarUrlDraft("");
    setAvatarPreview("");
  }

  function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(avatarUrlDraft.trim());
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(URL.createObjectURL(file));
  }

  const modalContent = open ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e3d7cd] bg-[#f4ede7] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-2xl">Nuevo usuario</h2>
          <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <form action={createUserAction} className="grid gap-3" onReset={resetAvatarDraft}>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="email"
              type="email"
              placeholder="correo@empresa.com"
              required
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              name="nombre"
              placeholder="Nombre completo"
              required
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              name="role"
              defaultValue="cliente"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
            <input
              name="tempPassword"
              placeholder="Clave temporal (opcional)"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-2">
              <input
                name="img_avatar"
                value={avatarUrlDraft}
                onChange={(event) => {
                  const value = event.target.value;
                  setAvatarUrlDraft(value);
                  if (!avatarPreview.startsWith("blob:")) {
                    setAvatarPreview(value.trim());
                  }
                }}
                placeholder="URL de foto de perfil (opcional)"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                name="avatarFile"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="block w-full text-xs"
              />
            </div>
            <div className="flex items-center justify-end md:justify-center">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Vista previa avatar"
                  className="size-16 rounded-full border border-[#d7c8bc] object-cover"
                />
              ) : (
                <span className="grid size-16 place-content-center rounded-full border border-dashed border-[#d7c8bc] text-[10px] text-muted-foreground">
                  Sin foto
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Se puede enviar verificación y recuperación desde la tabla luego de crear el usuario.
          </p>

          <div className="flex items-center gap-2">
            <Button type="submit">Guardar usuario</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Crear nuevo usuario
      </Button>

      {mounted && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
