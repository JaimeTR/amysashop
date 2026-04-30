"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useNotify } from "@/components/feedback/notification-center";

type ProfileSettingsFormProps = {
  userId: string;
  email: string;
  initialProfile: {
    nombre: string;
    telefono: string;
    direccion: string;
    gender: string;
    avatar_url: string;
  };
};

type ProfileDraft = {
  nombre: string;
  telefono: string;
  direccion: string;
  gender: string;
  avatar_url: string;
};

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = String(error?.message || "").toLowerCase();
  const needle = column.toLowerCase();
  return message.includes("column") && message.includes(needle) && message.includes("does not exist");
}

export function ProfileSettingsForm({ userId, email, initialProfile }: ProfileSettingsFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const notify = useNotify();

  const [draft, setDraft] = useState<ProfileDraft>(initialProfile);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
    };
  }, [uploadPreview]);

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
  }

  async function handleUploadAvatar() {
    if (!selectedFile) {
      notify.info("Imagen de perfil", "Primero selecciona una imagen de tu dispositivo.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const bucketName =
        process.env.NEXT_PUBLIC_SUPABASE_PROFILE_AVATARS_BUCKET ||
        process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET ||
        "profile-avatars";

      const extension = selectedFile.name.includes(".")
        ? selectedFile.name.split(".").pop()?.toLowerCase() || "jpg"
        : "jpg";
      const cleanName = selectedFile.name.replace(/\s+/g, "-").toLowerCase();
      const objectPath = `${userId}/${Date.now()}-${cleanName || `avatar.${extension}`}`;

      const upload = await supabase.storage.from(bucketName).upload(objectPath, selectedFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: selectedFile.type || undefined,
      });

      if (upload.error) {
        throw upload.error;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(objectPath);

      if (!data?.publicUrl) {
        throw new Error("No se pudo generar la URL pública del avatar.");
      }

      setDraft((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      setSelectedFile(null);
      notify.success("Imagen subida", "Tu nueva foto de perfil está lista para guardar.");
    } catch (error) {
      notify.error("Error al subir", String((error as { message?: string })?.message || "No se pudo subir la imagen."));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);

    const payload: Record<string, string | null> = {
      id: userId,
      nombre: draft.nombre.trim() || null,
      telefono: draft.telefono.trim() || null,
      direccion: draft.direccion.trim() || null,
      gender: draft.gender.trim() || null,
      avatar_url: draft.avatar_url.trim() || null,
    };

    try {
      let result = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

      if (result.error && (isMissingColumnError(result.error, "gender") || isMissingColumnError(result.error, "avatar_url"))) {
        const { gender: _omitGender, avatar_url: _omitAvatar, ...fallbackPayload } = payload;
        result = await supabase.from("profiles").upsert(fallbackPayload, { onConflict: "id" });
      }

      if (result.error) {
        throw result.error;
      }

      notify.success("Perfil actualizado", "Tus datos se guardaron correctamente.");
    } catch (error) {
      notify.error("No se pudo guardar", String((error as { message?: string })?.message || "Intenta nuevamente."));
    } finally {
      setSaving(false);
    }
  }

  const avatarSrc = uploadPreview || draft.avatar_url || "/placeholder-product.svg";

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-3">
        <Image
          src={avatarSrc}
          alt="Foto de perfil"
          width={84}
          height={84}
          unoptimized
          className="size-[84px] rounded-full border border-primary/20 object-cover"
        />
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground">Imagen de perfil</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs" />
          <Button type="button" variant="outline" onClick={handleUploadAvatar} disabled={!selectedFile || uploadingAvatar}>
            {uploadingAvatar ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}
            Subir imagen
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Correo</label>
          <input value={email} disabled className="h-10 w-full rounded-xl border border-input bg-muted px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
          <input
            value={draft.nombre}
            onChange={(event) => setDraft((prev) => ({ ...prev, nombre: event.target.value }))}
            className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Telefono</label>
          <input
            value={draft.telefono}
            onChange={(event) => setDraft((prev) => ({ ...prev, telefono: event.target.value }))}
            className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Direccion</label>
          <input
            value={draft.direccion}
            onChange={(event) => setDraft((prev) => ({ ...prev, direccion: event.target.value }))}
            className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Genero</label>
          <select
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

      <div className="flex justify-end">
        <Button type="button" onClick={handleSaveProfile} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
