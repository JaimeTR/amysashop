import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { ClientCreateModal } from "@/components/admin/client-create-modal";
import { ClientsInventoryTable } from "@/components/admin/clients-inventory-table";
import { requireAdminUser } from "@/lib/admin";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
  };
};

function randomPassword() {
  return `AMYSA${Math.random().toString(36).slice(2, 10)}!`;
}

async function createClientAction(formData: FormData) {
  "use server";

  await requireAdminUser("clients.manage");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const direccion = String(formData.get("direccion") || "").trim();
  const tempPassword = String(formData.get("tempPassword") || "").trim();

  if (!email || !nombre) {
    throw new Error("Ingresa email y nombre del cliente");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !secretKey) {
    throw new Error("Configura SUPABASE_SECRET_KEY para crear clientes");
  }

  const adminClient = createServiceClient(supabaseUrl, secretKey);

  const generatedPassword = tempPassword || randomPassword();

  const created = await adminClient.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      nombre,
      telefono,
      direccion,
    },
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message || "No se pudo crear el usuario");
  }

  const profileResult = await adminClient.from("profiles").upsert({
    id: created.data.user.id,
    nombre,
    telefono,
    direccion,
  });

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  revalidatePath("/admin/clientes");
}

async function updateClientDataAction(formData: FormData) {
  "use server";

  await requireAdminUser("clients.manage");
  const service = getAdminDataClient();

  if (!service) {
    throw new Error("Falta SUPABASE_SECRET_KEY en el entorno");
  }

  const userId = String(formData.get("userId") || "").trim();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const direccion = String(formData.get("direccion") || "").trim();

  if (!userId || !nombre) {
    throw new Error("Completa al menos nombre del cliente");
  }

  const authUpdate = await service.auth.admin.updateUserById(userId, {
    user_metadata: {
      nombre,
      telefono,
      direccion,
    },
  });

  if (authUpdate.error) {
    throw new Error(authUpdate.error.message || "No se pudo actualizar el usuario");
  }

  const profileUpdate = await service.from("profiles").upsert({
    id: userId,
    nombre,
    telefono,
    direccion,
  });

  if (profileUpdate.error) {
    throw new Error(profileUpdate.error.message || "No se pudo actualizar el perfil");
  }

  revalidatePath("/admin/clientes");
}

function getAdminDataClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !secret) {
    return null;
  }

  return createServiceClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function setClientStatusAction(formData: FormData) {
  "use server";

  await requireAdminUser("clients.manage");
  const service = getAdminDataClient();

  if (!service) {
    redirect("/admin/clientes?error=Falta+SUPABASE_SECRET_KEY+en+el+entorno");
  }

  const userId = String(formData.get("userId") || "").trim();
  const action = String(formData.get("action") || "").trim();

  if (!userId || (action !== "enable" && action !== "disable")) {
    redirect("/admin/clientes?error=Acción+de+cliente+inválida");
  }

  const result = await service.auth.admin.updateUserById(userId, {
    ban_duration: action === "disable" ? "876000h" : "none",
  });

  if (result.error) {
    redirect(`/admin/clientes?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/admin/clientes");
  redirect(action === "disable" ? "/admin/clientes?ok=Cliente+deshabilitado" : "/admin/clientes?ok=Cliente+habilitado");
}

async function deleteClientAction(formData: FormData) {
  "use server";

  await requireAdminUser("clients.manage");
  const service = getAdminDataClient();

  if (!service) {
    redirect("/admin/clientes?error=Falta+SUPABASE_SECRET_KEY+en+el+entorno");
  }

  const userId = String(formData.get("userId") || "").trim();

  if (!userId) {
    redirect("/admin/clientes?error=Cliente+inválido");
  }

  const result = await service.auth.admin.deleteUser(userId);

  if (result.error) {
    redirect(`/admin/clientes?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes?ok=Cliente+eliminado");
}

async function sendVerificationEmailAction(formData: FormData) {
  "use server";

  await requireAdminUser("clients.manage");
  const service = getAdminDataClient();

  if (!service) {
    redirect("/admin/clientes?error=Falta+SUPABASE_SECRET_KEY+en+el+entorno");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/admin/clientes?error=Correo+inválido+para+verificación");
  }

  const result = await service.auth.resend({
    type: "signup",
    email,
  });

  if (result.error) {
    redirect(`/admin/clientes?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes?ok=Correo+de+verificación+enviado");
}

async function sendPasswordResetAction(formData: FormData) {
  "use server";

  await requireAdminUser("clients.manage");
  const service = getAdminDataClient();

  if (!service) {
    redirect("/admin/clientes?error=Falta+SUPABASE_SECRET_KEY+en+el+entorno");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/admin/clientes?error=Correo+inválido+para+cambio+de+clave");
  }

  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
    : undefined;

  const result = await service.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (result.error) {
    redirect(`/admin/clientes?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes?ok=Correo+de+cambio+de+clave+enviado");
}

export default async function AdminClientesPage({ searchParams }: PageProps) {
  await requireAdminUser("clients.manage");
  const service = getAdminDataClient();

  if (!service) {
    return (
      <main className="space-y-5 pb-8">
        <header className="glass-card rounded-3xl p-5">
          <h1 className="font-[var(--font-display)] text-3xl">Gestión de clientes</h1>
          <p className="mt-2 text-sm text-rose-700">Falta configurar SUPABASE_SECRET_KEY para el módulo admin.</p>
        </header>
      </main>
    );
  }

  const [authUsersResult, profilesResult] = await Promise.all([
    service.auth.admin.listUsers({ page: 1, perPage: 200 }),
    service
      .from("profiles")
      .select("id,nombre,telefono,direccion,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const profileMap = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));

  const clients = (authUsersResult.data?.users || [])
    .filter((user) => {
      const role = String(user.user_metadata?.role || "cliente").toLowerCase();
      return role === "cliente";
    })
    .map((user) => {
      const profile = profileMap.get(user.id);
      return {
        id: user.id,
        email: user.email || "",
        nombre: profile?.nombre || (user.user_metadata?.nombre as string | undefined) || "",
        telefono: profile?.telefono || "",
        direccion: profile?.direccion || "",
        createdAt: profile?.created_at || user.created_at,
        isDisabled: Boolean(user.banned_until),
      };
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <main className="space-y-5 pb-8">
      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />

      <header className="glass-card rounded-3xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl">Gestión de clientes</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Registra clientes nuevos y administra su estado desde una vista completa.
            </p>
          </div>
          <ClientCreateModal createClientAction={createClientAction} />
        </div>
      </header>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay clientes registrados todavía.</p>
          ) : (
            <ClientsInventoryTable
              rows={clients}
              updateClientDataAction={updateClientDataAction}
              setClientStatusAction={setClientStatusAction}
              deleteClientAction={deleteClientAction}
              sendVerificationEmailAction={sendVerificationEmailAction}
              sendPasswordResetAction={sendPasswordResetAction}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
