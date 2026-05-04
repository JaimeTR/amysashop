"use client";

import { useState } from "react";
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
  initialProfile: {
    nombre: string;
    telefono: string;
    direccion: string;
    gender: string;
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
  initialProfile,
}: ProfileMobileViewProps) {
  const [isEditing, setIsEditing] = useState(false);

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
          <ProfileSettingsForm userId={userId} email={email} initialProfile={initialProfile} />
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
          <img
            src={userAvatar}
            alt="Foto de perfil"
            className="size-16 rounded-full border border-primary/20 object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{userName}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teléfono</p>
            <p className="mt-1 font-medium">{userPhone}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dirección</p>
            <p className="mt-1 font-medium">{userAddress}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Género</p>
            <p className="mt-1 font-medium">{userGender}</p>
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
