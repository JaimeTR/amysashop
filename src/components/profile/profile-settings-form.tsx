"use client";

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
};

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = String(error?.message || "").toLowerCase();
  const needle = column.toLowerCase();
  return message.includes("column") && message.includes(needle) && message.includes("does not exist");
}

export function ProfileSettingsForm({ userId, email, initialProfile }: ProfileSettingsFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const notify = useNotify();

  const [draft, setDraft] = useState<ProfileDraft>({
    nombre: initialProfile.nombre,
    telefono: initialProfile.telefono,
    direccion: initialProfile.direccion,
    gender: initialProfile.gender,
  });
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
        throw new Error(upload.error.message || `No se pudo subir la imagen al bucket ${bucketName}.`);
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(objectPath);

      if (!data?.publicUrl) {
        throw new Error("No se pudo generar la URL pública del avatar.");
      }

      const avatarUrl = data.publicUrl;
      console.log("[ProfileSettingsForm] Attempting to save avatar URL:", avatarUrl);

      let saveResult = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);

      console.log("[ProfileSettingsForm] Upsert result:", { 
        error: saveResult.error, 
        data: saveResult.data,
        status: saveResult.status 
      });

      if (saveResult.error) {
        console.log("[ProfileSettingsForm] Update failed, retrying with upsert");
        saveResult = await supabase.from("profiles").upsert(
          { id: userId, avatar_url: avatarUrl },
          { onConflict: "id" }
        );

        console.log("[ProfileSettingsForm] Upsert retry result:", {
          error: saveResult.error,
          data: saveResult.data,
          status: saveResult.status,
        });
      }

      if (saveResult.error) {
        console.error("[ProfileSettingsForm] Avatar save failed:", saveResult.error);
        throw new Error(saveResult.error.message || "No se pudo guardar la foto en tu perfil.");
      }

      console.log("[ProfileSettingsForm] Avatar saved successfully to database");
      setSelectedFile(null);
      try {
        console.debug("[ProfileSettingsForm] dispatching amysa:avatar-updated", { url: avatarUrl });
        window.dispatchEvent(new CustomEvent("amysa:avatar-updated", { detail: { avatar_url: avatarUrl } }));
      } catch (err) {
        console.debug("[ProfileSettingsForm] failed dispatching avatar event", err);
      }
      notify.success("Imagen subida", "Tu foto de perfil se actualizó correctamente.");
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
    };

    try {
      console.log("[ProfileSettingsForm] Attempting profile save with payload:", payload);
      
      let result = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

      console.log("[ProfileSettingsForm] First upsert result:", { 
        error: result.error, 
        data: result.data,
        status: result.status 
      });

      if (result.error && isMissingColumnError(result.error, "gender")) {
        console.log("[ProfileSettingsForm] Missing column detected, retrying without gender");
        const { gender: _omitGender, ...fallbackPayload } = payload;
        result = await supabase.from("profiles").upsert(fallbackPayload, { onConflict: "id" });
        console.log("[ProfileSettingsForm] Fallback upsert result:", { 
          error: result.error, 
          data: result.data,
          status: result.status 
        });
      }

      if (result.error) {
        console.error("[ProfileSettingsForm] Profile save failed:", result.error);
        throw result.error;
      }

      console.log("[ProfileSettingsForm] Profile saved successfully");
      notify.success("Perfil actualizado", "Tus datos se guardaron correctamente.");
      try {
        const updated = {
          nombre: payload.nombre,
          telefono: payload.telefono,
          direccion: payload.direccion,
          gender: String(payload.gender || ""),
        };
        console.debug("[ProfileSettingsForm] dispatching amysa:profile-updated", updated);
        window.dispatchEvent(new CustomEvent("amysa:profile-updated", { detail: updated }));
      } catch (err) {
        console.debug("[ProfileSettingsForm] failed dispatching profile event", err);
      }
    } catch (error) {
      console.error("[ProfileSettingsForm] Exception during profile save:", error);
      notify.error("No se pudo guardar", String((error as { message?: string })?.message || "Intenta nuevamente."));
    } finally {
      setSaving(false);
    }
  }

  const avatarSrc = uploadPreview || initialProfile.avatar_url || "/placeholder-product.svg";

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/70 bg-white/70 p-4 sm:flex-row sm:items-center">
        <img
          src={avatarSrc}
          alt="Foto de perfil"
          key={avatarSrc}
          className="size-[88px] rounded-full border border-primary/20 object-cover"
        />
        <div className="w-full space-y-3 sm:flex-1">
          <label className="block text-xs font-semibold text-muted-foreground">Imagen de perfil</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs" />
          <Button type="button" variant="outline" onClick={handleUploadAvatar} disabled={!selectedFile || uploadingAvatar} className="w-full sm:w-auto">
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
