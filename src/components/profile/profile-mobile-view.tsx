"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ProfileSettingsForm } from "./profile-settings-form";

type ProfileMobileViewProps = {
  userId: string;
  email: string;
  userAvatar: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userGender: string;
  initialEditMode?: boolean;
  initialProfile: {
    nombre: string;
    telefono: string;
    direccion: string;
    gender: string;
    img_avatar: string;
    avatar_url: string;
  };
};

export function ProfileMobileView({
  userId,
  email,
  userAvatar,
  userName,
  userPhone,
  userAddress,
  userGender,
  initialEditMode = false,
  initialProfile,
}: ProfileMobileViewProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
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

  if (isEditing) {
    return (
      <Card className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-white to-primary/5 shadow-lg shadow-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-primary">Editar perfil</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(false)}
            className="size-10"
          >
            <ChevronLeft className="size-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-white to-primary/5 shadow-lg shadow-primary/10">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-primary">Datos del perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
          <Image
            src={displayProfile.avatar}
            alt="Foto de perfil"
            width={64}
            height={64}
            unoptimized
            className="size-16 rounded-full border border-primary/20 object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{displayProfile.nombre}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teléfono</p>
            <p className="mt-1 font-medium">{displayProfile.telefono}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dirección</p>
            <p className="mt-1 font-medium">{displayProfile.direccion}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Género</p>
            <p className="mt-1 font-medium">{displayProfile.gender}</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full rounded-xl"
        >
          Actualizar perfil
        </Button>
      </CardContent>
    </Card>
  );
}
