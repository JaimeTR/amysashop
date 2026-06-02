"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/components/feedback/notification-center";

type ProfileSettingsFormProps = {
  userId: string;
  email: string;
  formId?: string;
  showSubmitButton?: boolean;
  onProfileSaved?: (profile: {
    nombre: string;
    telefono: string;
    direccion: string;
    gender: string;
    img_avatar: string;
    avatar_url: string;
  }) => void;
  initialProfile: {
    nombre: string;
    telefono: string;
    direccion: string;
    gender: string;
    img_avatar: string;
    avatar_url: string;
  };
};

type ProfileDraft = {
  nombre: string;
  telefono: string;
  direccion: string;
  gender: string;
};

export function ProfileSettingsForm({
  userId,
  email,
  formId,
  showSubmitButton = true,
  onProfileSaved,
  initialProfile,
}: ProfileSettingsFormProps) {
  const notify = useNotify();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<ProfileDraft>({
    nombre: initialProfile.nombre,
    telefono: initialProfile.telefono,
    direccion: initialProfile.direccion,
    gender: initialProfile.gender,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAvatarUrl, setSavedAvatarUrl] = useState(
    initialProfile.img_avatar.trim() || initialProfile.avatar_url.trim() || ""
  );

  useEffect(() => {
    return () => {
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
    };
  }, [uploadPreview]);

  function openAvatarPicker() {
    avatarInputRef.current?.click();
  }

  async function saveProfile(
    fileToUpload: File | null = selectedFile,
    options: { closeAfterSave?: boolean } = {}
  ) {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("id", userId);
      formData.append("nombre", draft.nombre.trim());
      formData.append("telefono", draft.telefono.trim());
      formData.append("direccion", draft.direccion.trim());
      formData.append("gender", draft.gender.trim());
      formData.append("avatarUrl", savedAvatarUrl.trim());

      if (fileToUpload) {
        formData.append("avatarFile", fileToUpload);
      }

      const response = await fetch("/api/perfil", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json().catch(() => ({}))) as { success?: boolean; avatarUrl?: string; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "No se pudo guardar el perfil.");
      }

      if (result.avatarUrl) {
        setSavedAvatarUrl(result.avatarUrl);
        setUploadPreview("");
        try {
          window.dispatchEvent(new CustomEvent("amysa:avatar-updated", { detail: { img_avatar: result.avatarUrl, avatar_url: result.avatarUrl } }));
        } catch (err) {
          console.debug("[ProfileSettingsForm] failed dispatching avatar event", err);
        }
      }

      setSelectedFile(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }

      notify.success("Perfil actualizado", "Tus cambios se guardaron correctamente.");

      const updated = {
        nombre: draft.nombre.trim(),
        telefono: draft.telefono.trim(),
        direccion: draft.direccion.trim(),
        gender: draft.gender.trim(),
        img_avatar: result.avatarUrl || savedAvatarUrl,
        avatar_url: result.avatarUrl || savedAvatarUrl,
      };

      try {
        window.dispatchEvent(new CustomEvent("amysa:profile-updated", { detail: updated }));
      } catch (err) {
        console.debug("[ProfileSettingsForm] failed dispatching profile event", err);
      }

      onProfileSaved?.(updated);

      router.refresh();

      if (options.closeAfterSave) {
        return;
      }
    } catch (error) {
      notify.error("No se pudo guardar", String((error as { message?: string })?.message || "Intenta nuevamente."));
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
      setUploadPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      notify.warning("Archivo inválido", "Selecciona una imagen válida.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.warning("Imagen muy pesada", "La imagen debe ser menor a 5 MB.");
      return;
    }

    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }

    setSelectedFile(file);
    setUploadPreview(URL.createObjectURL(file));
    void saveProfile(file, { closeAfterSave: false });
  }

  async function handleSaveProfile() {
    await saveProfile(selectedFile, { closeAfterSave: true });
  }

  const avatarSrc = uploadPreview || savedAvatarUrl || initialProfile.img_avatar || initialProfile.avatar_url || "/placeholder-product.svg";

  const isBlobOrDataSrc = (src: string) => src.startsWith("blob:") || src.startsWith("data:");

  return (
    <form id={formId} onSubmit={(event) => {
      event.preventDefault();
      void handleSaveProfile();
    }} className="space-y-4 text-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/70 bg-white/70 p-4 sm:flex-row sm:items-center">
        {isBlobOrDataSrc(avatarSrc) ? (
          <button
            type="button"
            onClick={openAvatarPicker}
            className="relative h-[88px] w-[88px] overflow-hidden rounded-full border border-primary/20 bg-center bg-cover transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/40"
            style={{ backgroundImage: `url(${avatarSrc})` }}
            aria-label="Cambiar foto de perfil"
          >
            <span className="absolute inset-0 grid place-content-center bg-black/25 text-white opacity-0 transition hover:opacity-100">
              <Camera className="size-5" />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openAvatarPicker}
            className="relative h-[88px] w-[88px] overflow-hidden rounded-full border border-primary/20 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Cambiar foto de perfil"
          >
            <Image
              src={avatarSrc}
              alt="Foto de perfil"
              key={avatarSrc}
              width={88}
              height={88}
              className="h-full w-full rounded-full object-cover"
              sizes="88px"
            />
            <span className="absolute inset-0 grid place-content-center bg-black/25 text-white opacity-0 transition hover:opacity-100">
              <Camera className="size-5" />
            </span>
          </button>
        )}
        <div className="w-full space-y-3 sm:flex-1">
          <label htmlFor="profile-avatar-file" className="block text-xs font-semibold text-muted-foreground">
            Imagen de perfil
          </label>
          <input
            ref={avatarInputRef}
            id="profile-avatar-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          <p className="text-xs text-muted-foreground">Haz clic en la foto para cambiarla. Se guarda automáticamente.</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="profile-email" className="text-xs font-semibold text-muted-foreground">Correo</label>
          <input id="profile-email" value={email} disabled className="h-10 w-full rounded-xl border border-input bg-muted px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="profile-nombre" className="text-xs font-semibold text-muted-foreground">Nombre</label>
          <input
            id="profile-nombre"
            value={draft.nombre}
            onChange={(event) => setDraft((prev) => ({ ...prev, nombre: event.target.value }))}
            className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="profile-telefono" className="text-xs font-semibold text-muted-foreground">Telefono</label>
          <input
            id="profile-telefono"
            value={draft.telefono}
            onChange={(event) => setDraft((prev) => ({ ...prev, telefono: event.target.value }))}
            className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="profile-direccion" className="text-xs font-semibold text-muted-foreground">Direccion</label>
          <input
            id="profile-direccion"
            value={draft.direccion}
            onChange={(event) => setDraft((prev) => ({ ...prev, direccion: event.target.value }))}
            className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="profile-genero" className="text-xs font-semibold text-muted-foreground">Genero</label>
          <select
            id="profile-genero"
            value={draft.gender}
            onChange={(event) => setDraft((prev) => ({ ...prev, gender: event.target.value }))}
            className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
          >
            <option value="">Selecciona genero</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </div>
      </div>

      {showSubmitButton ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
