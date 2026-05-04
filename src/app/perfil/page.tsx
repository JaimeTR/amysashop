import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { ProfileMobileView } from "@/components/profile/profile-mobile-view";

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = String(error?.message || "").toLowerCase();
  const needle = column.toLowerCase();
  return message.includes("column") && message.includes(needle) && message.includes("does not exist");
}

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let result = await supabase
    .from("profiles")
    .select("nombre, telefono, direccion, gender, img_avatar, avatar_url")
    .eq("id", user.id)
    .single();

  if (
    result.error &&
    (isMissingColumnError(result.error, "gender") || isMissingColumnError(result.error, "img_avatar") || isMissingColumnError(result.error, "avatar_url"))
  ) {
    result = await supabase
      .from("profiles")
      .select("nombre, telefono, direccion")
      .eq("id", user.id)
      .single();
  }

  const profile = result.data as {
    nombre?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    gender?: string | null;
    img_avatar?: string | null;
    avatar_url?: string | null;
  } | null;

  const profileAvatar = profile?.img_avatar?.trim() || profile?.avatar_url?.trim() || "/placeholder-product.svg";
  const profileName = profile?.nombre?.trim() || user.email || "Mi cuenta";
  const profilePhone = profile?.telefono?.trim() || "Sin teléfono";
  const profileAddress = profile?.direccion?.trim() || "Sin dirección registrada";
  const profileGender = profile?.gender?.trim()
    ? profile.gender === "masculino" || profile.gender === "male"
      ? "Masculino"
      : profile.gender === "femenino" || profile.gender === "female"
        ? "Femenino"
        : profile.gender
    : "Sin género";

  return (
    <main className="space-y-4 pb-8">
      <h1 className="font-[var(--font-display)] text-center text-3xl md:text-left">Mi cuenta</h1>

      <div className="md:hidden">
        <ProfileMobileView
          userId={user.id}
          email={user.email ?? "Sin correo"}
          userAvatar={profileAvatar}
          userName={profileName}
          userPhone={profilePhone}
          userAddress={profileAddress}
          userGender={profileGender}
          initialProfile={{
            nombre: profile?.nombre ?? "",
            telefono: profile?.telefono ?? "",
            direccion: profile?.direccion ?? "",
            gender: profile?.gender ?? "",
            img_avatar: profile?.img_avatar ?? "",
            avatar_url: profile?.avatar_url ?? "",
          }}
        />
      </div>

      <Card className="hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-white to-primary/5 shadow-lg shadow-primary/10 md:block">
        <CardHeader>
          <CardTitle className="text-primary">Datos de cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm
            userId={user.id}
            email={user.email ?? "Sin correo"}
            initialProfile={{
              nombre: profile?.nombre ?? "",
              telefono: profile?.telefono ?? "",
              direccion: profile?.direccion ?? "",
              gender: profile?.gender ?? "",
              img_avatar: profile?.img_avatar ?? "",
              avatar_url: profile?.avatar_url ?? "",
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
