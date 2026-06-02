"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileSettingsForm } from "./profile-settings-form";

type ProfileDesktopViewProps = {
  userId: string;
  email: string;
  userAvatar: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userGender: string;
  initialProfile: {
    nombre: string;
    telefono: string;
    direccion: string;
    gender: string;
    img_avatar: string;
    avatar_url: string;
  };
};

export function ProfileDesktopView({
  userId,
  email,
  userAvatar,
  userName,
  userPhone,
  userAddress,
  userGender,
  initialProfile,
}: ProfileDesktopViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayProfile, setDisplayProfile] = useState({
    nombre: userName,
    telefono: userPhone,
    direccion: userAddress,
    gender: userGender,
    avatar: userAvatar,
  });

  function formatGender(value: string) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return "Sin género";
    if (normalized === "masculino" || normalized === "male") return "Masculino";
    if (normalized === "femenino" || normalized === "female") return "Femenino";
    return value;
  }

  return (
    <Card className="hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-white to-primary/5 shadow-lg shadow-primary/10 md:block">
      <CardHeader>
        <CardTitle className="text-primary">Datos de cuenta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <ProfileSettingsForm
            formId="profile-desktop-form"
            showSubmitButton={false}
            userId={userId}
            email={email}
            initialProfile={initialProfile}
            onProfileSaved={(updated) => {
              setDisplayProfile({
                nombre: updated.nombre || "Mi cuenta",
                telefono: updated.telefono || "Sin teléfono",
                direccion: updated.direccion || "Sin dirección registrada",
                gender: formatGender(updated.gender),
                avatar: updated.img_avatar || updated.avatar_url || displayProfile.avatar,
              });
              setIsEditing(false);
            }}
          />
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
              <Image
                src={displayProfile.avatar}
                alt="Foto de perfil"
                width={72}
                height={72}
                className="size-[72px] rounded-full border border-primary/20 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">{displayProfile.nombre}</p>
                <p className="truncate text-sm text-muted-foreground">{email}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teléfono</p>
                <p className="mt-1 font-medium">{displayProfile.telefono}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Género</p>
                <p className="mt-1 font-medium">{displayProfile.gender}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-3 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dirección</p>
                <p className="mt-1 font-medium">{displayProfile.direccion}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit" form="profile-desktop-form">
                Guardar cambios
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)}>
              Modificar perfil
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
