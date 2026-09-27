import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  AdminPermission,
  canAccessAdmin,
  getPermissionsForRole,
  getRoleLabel,
  getRedirectPathForRole,
  hasPermission,
  resolveRoleFromContext,
} from "@/lib/access-control";

function getSuperAdminEmail() {
  return (process.env.ADMIN_ALLOWED_EMAIL || "").trim().toLowerCase();
}

type ProfileRoleData = {
  role: string | null;
  isAdmin: boolean;
};

async function getProfileRoleData(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<ProfileRoleData> {
  const serviceClient = createServiceRoleClient();

  if (serviceClient) {
    const { data, error } = await serviceClient
      .from("profiles")
      .select("role,is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      return {
        role: (data as { role?: string | null }).role ?? null,
        isAdmin: Boolean((data as { is_admin?: boolean }).is_admin),
      };
    }
  }

  const withRole = await supabase
    .from("profiles")
    .select("role,is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (!withRole.error && withRole.data) {
    return {
      role: (withRole.data as { role?: string | null }).role ?? null,
      isAdmin: Boolean((withRole.data as { is_admin?: boolean }).is_admin),
    };
  }

  const fallback = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  return {
    role: null,
    isAdmin: Boolean((fallback.data as { is_admin?: boolean } | null)?.is_admin),
  };
}

export async function requireAdminUser(requiredPermission: AdminPermission = "dashboard.view") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const superAdminEmail = getSuperAdminEmail();
  const userEmail = (user.email || "").trim().toLowerCase();

  if (superAdminEmail && userEmail === superAdminEmail) {
    const role = "superadmin" as const;

    if (!hasPermission(role, requiredPermission)) {
      redirect(`/acceso-restringido?reason=permission&role=${encodeURIComponent(role)}`);
    }

    const permissions = getPermissionsForRole(role);

    return {
      supabase,
      user,
      role,
      roleLabel: getRoleLabel(role),
      permissions,
    };
  }

  // El rol se toma solo de profiles: user_metadata es editable por el propio usuario.
  const profileData = await getProfileRoleData(supabase, user.id);

  const role = resolveRoleFromContext({
    email: user.email,
    profileRole: profileData.role,
    isAdmin: profileData.isAdmin,
    superAdminEmail,
  });

  if (!canAccessAdmin(role)) {
    redirect(`/acceso-restringido?reason=profile&role=${encodeURIComponent(role)}`);
  }

  if (!hasPermission(role, requiredPermission)) {
    redirect(`/acceso-restringido?reason=permission&role=${encodeURIComponent(role)}`);
  }

  const permissions = getPermissionsForRole(role);

  return {
    supabase,
    user,
    role,
    roleLabel: getRoleLabel(role),
    permissions,
  };
}

// Para rutas API: resuelve el rol del usuario desde profiles (nunca desde user_metadata).
export async function resolveUserRole(user: { id: string; email?: string | null }) {
  const supabase = createClient();
  const profileData = await getProfileRoleData(supabase, user.id);

  return resolveRoleFromContext({
    email: user.email,
    profileRole: profileData.role,
    isAdmin: profileData.isAdmin,
    superAdminEmail: getSuperAdminEmail(),
  });
}
