import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  AdminPermission,
  canAccessAdmin,
  getPermissionsForRole,
  getRoleLabel,
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
      if (requiredPermission === "dashboard.view") {
        redirect("/");
      }
      redirect("/admin");
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

  // Si el rol viene en metadata y ya permite admin, evitamos consultar profiles.
  // Esto ayuda cuando hay políticas RLS recursivas en la tabla profiles.
  const metadataOnlyRole = resolveRoleFromContext({
    email: user.email,
    metadataRole: (user.user_metadata?.role as string | null | undefined) ?? null,
    superAdminEmail,
  });

  if (canAccessAdmin(metadataOnlyRole)) {
    if (!hasPermission(metadataOnlyRole, requiredPermission)) {
      if (requiredPermission === "dashboard.view") {
        redirect("/");
      }
      redirect("/admin");
    }

    const permissions = getPermissionsForRole(metadataOnlyRole);

    return {
      supabase,
      user,
      role: metadataOnlyRole,
      roleLabel: getRoleLabel(metadataOnlyRole),
      permissions,
    };
  }

  const profileData = await getProfileRoleData(supabase, user.id);

  const role = resolveRoleFromContext({
    email: user.email,
    metadataRole: (user.user_metadata?.role as string | null | undefined) ?? null,
    profileRole: profileData.role,
    isAdmin: profileData.isAdmin,
    superAdminEmail,
  });

  if (!canAccessAdmin(role)) {
    redirect("/");
  }

  if (!hasPermission(role, requiredPermission)) {
    if (requiredPermission === "dashboard.view") {
      redirect("/");
    }
    redirect("/admin");
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
