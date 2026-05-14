import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient, createClient as createServiceClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { UserCreateModal } from "@/components/admin/user-create-modal";
import { UsersInventoryTable } from "@/components/admin/users-inventory-table";
import { type AccessRole } from "@/lib/access-control";
import { requireAdminUser } from "@/lib/admin";

type PageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
  };
};

const editableRoles: AccessRole[] = ["administrador", "duena", "vendedora", "socia", "cliente"];
const creatableRoles: AccessRole[] = ["superadmin", "administrador", "duena", "vendedora", "socia", "cliente"];

function isMissingColumnError(error: { message?: string } | null | undefined, column: string) {
  const message = String(error?.message || "").toLowerCase();
  const needle = column.toLowerCase();
  return message.includes("column") && message.includes(needle) && message.includes("does not exist");
}

function randomPassword() {
  return `AMYSA${Math.random().toString(36).slice(2, 10)}!`;
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !secretKey) {
    return null;
  }

  return createServiceClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getPublicAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function uploadAvatarFromFile(service: NonNullable<ReturnType<typeof getServiceClient>>, userId: string, file: File) {
  const bucketName =
    process.env.NEXT_PUBLIC_SUPABASE_PROFILE_AVATARS_BUCKET ||
    process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET ||
    "profile-avatars";

  const fileType = String(file.type || "").toLowerCase();
  if (!fileType.startsWith("image/")) {
    return "";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "";
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
  const cleanName = file.name.replace(/\s+/g, "-").toLowerCase();
  const objectPath = `${userId}/${Date.now()}-${cleanName || `avatar.${extension}`}`;

  const upload = await service.storage.from(bucketName).upload(objectPath, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });

  if (upload.error) {
    return "";
  }

  const { data } = service.storage.from(bucketName).getPublicUrl(objectPath);
  return data?.publicUrl || "";
}

async function createUserAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser("users.manage");

  if (admin.role !== "superadmin") {
    redirect("/admin/usuarios?error=Solo+superadmin+puede+crear+usuarios");
  }

  const service = getServiceClient();

  if (!service) {
    redirect("/admin/usuarios?error=Configura+SUPABASE_SECRET_KEY+para+gestionar+usuarios");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") || "").trim();
  const role = String(formData.get("role") || "cliente").trim().toLowerCase() as AccessRole;
  const tempPassword = String(formData.get("tempPassword") || "").trim();
  const avatarUrlInput = String(formData.get("img_avatar") || formData.get("avatar_url") || "").trim();
  const avatarFile = formData.get("avatarFile");

  if (!email || !nombre || !creatableRoles.includes(role)) {
    redirect("/admin/usuarios?error=Completa+email%2C+nombre+y+rol+válido");
  }

  const generatedPassword = tempPassword || randomPassword();

  let finalAvatarUrl = avatarUrlInput;

  const createResult = await service.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: false,
    user_metadata: {
      nombre,
      role,
        img_avatar: finalAvatarUrl || undefined,
    },
  });

  if (createResult.error || !createResult.data.user) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(createResult.error?.message || "No se pudo crear el usuario")}`);
  }

  const avatarFromFile =
    avatarFile instanceof File && avatarFile.size > 0 ? await uploadAvatarFromFile(service, createResult.data.user.id, avatarFile) : "";

  if (avatarFromFile) {
    finalAvatarUrl = avatarFromFile;
    await service.auth.admin.updateUserById(createResult.data.user.id, {
      user_metadata: {
        nombre,
        role,
        img_avatar: finalAvatarUrl,
      },
    });
  }

  let profileResult = await service.from("profiles").upsert({
    id: createResult.data.user.id,
    nombre,
    is_admin: role !== "cliente",
    role,
    img_avatar: finalAvatarUrl || null,
  });

  if (profileResult.error && (isMissingColumnError(profileResult.error, "img_avatar") || isMissingColumnError(profileResult.error, "avatar_url"))) {
    profileResult = await service.from("profiles").upsert({
      id: createResult.data.user.id,
      nombre,
      is_admin: role !== "cliente",
      role,
    });
  }

  if (profileResult.error) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(profileResult.error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=Usuario+creado.+Puedes+enviar+verificación+desde+acciones");
}

async function updateUserRoleAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser("users.manage");

  if (admin.role !== "superadmin") {
    redirect("/admin?error=Solo+superadmin+puede+editar+roles");
  }

  const service = getServiceClient();

  if (!service) {
    redirect("/admin/usuarios?error=Configura+SUPABASE_SECRET_KEY+para+editar+roles");
  }

  const userId = String(formData.get("userId") || "").trim();
  const role = String(formData.get("role") || "").trim().toLowerCase() as AccessRole;

  if (!userId || !editableRoles.includes(role)) {
    redirect("/admin/usuarios?error=Datos+de+rol+inválidos");
  }

  const userResult = await service.auth.admin.updateUserById(userId, {
    user_metadata: {
      role,
    },
  });

  if (userResult.error) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(userResult.error.message)}`);
  }

  await service.from("profiles").update({ is_admin: role !== "cliente", role }).eq("id", userId);

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=Rol+actualizado+correctamente");
}

async function updateUserDataAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser("users.manage");

  if (admin.role !== "superadmin") {
    throw new Error("Solo superadmin puede editar datos de usuario");
  }

  const service = getServiceClient();

  if (!service) {
    throw new Error("Configura SUPABASE_SECRET_KEY para editar usuarios");
  }

  const userId = String(formData.get("userId") || "").trim();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const direccion = String(formData.get("direccion") || "").trim();

  if (!userId || !nombre) {
    throw new Error("Completa el nombre del usuario");
  }

  const currentUser = await service.auth.admin.getUserById(userId);
  if (currentUser.error || !currentUser.data.user) {
    throw new Error(currentUser.error?.message || "No se encontro el usuario");
  }

  const currentMetadata = (currentUser.data.user.user_metadata || {}) as Record<string, unknown>;

  // Actualizamos solo claves puntuales para evitar conflictos con atributos de auth.
  const updateAuth = await service.auth.admin.updateUserById(userId, {
    user_metadata: {
      nombre,
      role: typeof currentMetadata.role === "string" ? currentMetadata.role : undefined,
      img_avatar: typeof currentMetadata.img_avatar === "string" ? currentMetadata.img_avatar : undefined,
    },
  });

  if (updateAuth.error) {
    const message = String(updateAuth.error.message || "").toLowerCase();
    if (!message.includes("already been registered")) {
      throw new Error(updateAuth.error.message || "No se pudo actualizar metadata del usuario");
    }
  }

  let profileUpdate = await service
    .from("profiles")
    .update({ nombre, telefono: telefono || null, direccion: direccion || null })
    .eq("id", userId);

  if (profileUpdate.error && (isMissingColumnError(profileUpdate.error, "telefono") || isMissingColumnError(profileUpdate.error, "direccion"))) {
    profileUpdate = await service.from("profiles").update({ nombre }).eq("id", userId);
  }

  if (profileUpdate.error) {
    throw new Error(profileUpdate.error.message || "No se pudo actualizar perfil del usuario");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
}

async function setUserStatusAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser("users.manage");

  if (admin.role !== "superadmin") {
    redirect("/admin/usuarios?error=Solo+superadmin+puede+habilitar+o+deshabilitar");
  }

  const service = getServiceClient();

  if (!service) {
    redirect("/admin/usuarios?error=Configura+SUPABASE_SECRET_KEY+para+gestionar+usuarios");
  }

  const userId = String(formData.get("userId") || "").trim();
  const action = String(formData.get("action") || "").trim();

  if (!userId || (action !== "enable" && action !== "disable")) {
    redirect("/admin/usuarios?error=Acción+inválida");
  }

  const result = await service.auth.admin.updateUserById(userId, {
    ban_duration: action === "disable" ? "876000h" : "none",
  });

  if (result.error) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/admin/usuarios");
  redirect(action === "disable" ? "/admin/usuarios?ok=Usuario+deshabilitado" : "/admin/usuarios?ok=Usuario+habilitado");
}

async function sendVerificationAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser("users.manage");

  if (admin.role !== "superadmin") {
    redirect("/admin/usuarios?error=Solo+superadmin+puede+enviar+verificación");
  }

  const publicAuth = getPublicAuthClient();
  if (!publicAuth) {
    redirect("/admin/usuarios?error=Falta+configurar+NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/admin/usuarios?error=Correo+inválido+para+verificación");
  }

  const result = await publicAuth.auth.resend({
    type: "signup",
    email,
  });

  if (result.error) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(result.error.message)}`);
  }

  redirect("/admin/usuarios?ok=Verificación+enviada+al+correo");
}

async function sendPasswordResetAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser("users.manage");

  if (admin.role !== "superadmin") {
    redirect("/admin/usuarios?error=Solo+superadmin+puede+enviar+reseteo+de+clave");
  }

  const publicAuth = getPublicAuthClient();
  if (!publicAuth) {
    redirect("/admin/usuarios?error=Falta+configurar+NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/admin/usuarios?error=Correo+inválido+para+reseteo");
  }

  const result = await publicAuth.auth.resetPasswordForEmail(email);

  if (result.error) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(result.error.message)}`);
  }

  redirect("/admin/usuarios?ok=Correo+de+recuperación+enviado");
}

async function deleteUserAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser("users.manage");

  if (admin.role !== "superadmin") {
    redirect("/admin/usuarios?error=Solo+superadmin+puede+eliminar+usuarios");
  }

  const service = getServiceClient();

  if (!service) {
    redirect("/admin/usuarios?error=Configura+SUPABASE_SECRET_KEY+para+eliminar+usuarios");
  }

  const userId = String(formData.get("userId") || "").trim();

  if (!userId) {
    redirect("/admin/usuarios?error=Usuario+inválido");
  }

  const result = await service.auth.admin.deleteUser(userId);

  if (result.error) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=Usuario+eliminado");
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const admin = await requireAdminUser("users.manage");

  if (admin.role !== "superadmin") {
    redirect("/admin");
  }

  const service = getServiceClient();

  if (!service) {
    return (
      <main className="space-y-5 pb-8">
        <header className="glass-card rounded-3xl p-5">
          <h1 className="font-[var(--font-display)] text-3xl">Usuarios y roles</h1>
          <p className="mt-2 text-sm text-destructive-foreground">Falta configurar SUPABASE_SECRET_KEY para gestionar roles.</p>
        </header>
      </main>
    );
  }

  const authUsers = await service.auth.admin.listUsers({ page: 1, perPage: 300 });
  const superAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "").trim().toLowerCase();

  const userIds = (authUsers.data?.users || []).map((user) => user.id);
  const profilesWithContact = await service
    .from("profiles")
    .select("id,nombre,telefono,direccion")
    .in("id", userIds);
  const profilesWithoutContact = await service
    .from("profiles")
    .select("id,nombre")
    .in("id", userIds);

  const profileRows = (!profilesWithContact.error && profilesWithContact.data
    ? profilesWithContact.data
    : profilesWithoutContact.data || []) as Array<{
    id: string;
    nombre?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  }>;
  const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));

  const rows = (authUsers.data?.users || []).map((user) => {
    const metadataRole = String(user.user_metadata?.role || "").toLowerCase();
    const role = creatableRoles.includes(metadataRole as AccessRole) ? (metadataRole as AccessRole) : "cliente";
    const email = user.email || "";
    const isMainSuperadmin = Boolean(superAdminEmail) && email.toLowerCase() === superAdminEmail;

    const profile = profileMap.get(user.id);

    return {
      id: user.id,
      email,
      nombre: String(profile?.nombre || user.user_metadata?.nombre || ""),
      telefono: String(profile?.telefono || ""),
      direccion: String(profile?.direccion || ""),
      role: isMainSuperadmin ? "superadmin" : role,
      isMainSuperadmin,
      isProtectedSuperadmin: isMainSuperadmin || role === "superadmin",
      createdAt: user.created_at,
      isDisabled: Boolean(user.banned_until),
      verified: Boolean(user.email_confirmed_at),
    };
  });

  return (
    <main className="space-y-5 pb-8">
      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />

      <header className="glass-card rounded-3xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl">Usuarios y roles</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Registra usuarios nuevos, define sus roles y ejecuta acciones de seguridad por cuenta.
            </p>
          </div>
          <UserCreateModal createUserAction={createUserAction} roles={creatableRoles} />
        </div>
      </header>

      <Card className="glass-card">
        <CardContent className="pt-5">
          <UsersInventoryTable
            rows={rows}
            editableRoles={editableRoles}
            updateUserDataAction={updateUserDataAction}
            updateUserRoleAction={updateUserRoleAction}
            setUserStatusAction={setUserStatusAction}
            sendVerificationAction={sendVerificationAction}
            sendPasswordResetAction={sendPasswordResetAction}
            deleteUserAction={deleteUserAction}
          />
        </CardContent>
      </Card>
    </main>
  );
}
