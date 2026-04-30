import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";

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
    .select("nombre, telefono, direccion, gender, avatar_url")
    .eq("id", user.id)
    .single();

  if (result.error && (isMissingColumnError(result.error, "gender") || isMissingColumnError(result.error, "avatar_url"))) {
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
    avatar_url?: string | null;
  } | null;

  return (
    <main className="space-y-4 pb-8">
      <h1 className="font-[var(--font-display)] text-3xl">Perfil</h1>
      <Card className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-white to-primary/5 shadow-lg shadow-primary/10">
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
              avatar_url: profile?.avatar_url ?? "",
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
