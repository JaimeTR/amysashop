export type AccessRole = "superadmin" | "administrador" | "duena" | "vendedora" | "socia" | "cliente";

export type AdminPermission =
  | "dashboard.view"
  | "products.manage"
  | "clients.manage"
  | "orders.manage"
  | "store.manage"
  | "chat.manage"
  | "users.manage"
  | "inventory.manage";

const roleLabels: Record<AccessRole, string> = {
  superadmin: "Superadmin",
  administrador: "Administrador",
  duena: "Dueña",
  vendedora: "Vendedora",
  socia: "Socia",
  cliente: "Cliente",
};

const permissionLabels: Record<AdminPermission, string> = {
  "dashboard.view": "Ver dashboard",
  "products.manage": "Gestión de productos",
  "clients.manage": "Gestión de clientes",
  "orders.manage": "Gestión de pedidos",
  "store.manage": "Gestión de tienda",
  "chat.manage": "Gestión de chats y leads",
  "users.manage": "Gestión de usuarios y roles",
  "inventory.manage": "Gestión de inventario",
};

const rolePermissions: Record<AccessRole, AdminPermission[]> = {
  superadmin: [
    "dashboard.view",
    "products.manage",
    "clients.manage",
    "orders.manage",
    "store.manage",
    "chat.manage",
    "users.manage",
    "inventory.manage",
  ],
  administrador: [
    "dashboard.view",
    "products.manage",
    "clients.manage",
    "orders.manage",
    "store.manage",
    "chat.manage",
    "inventory.manage",
  ],
  duena: ["dashboard.view", "products.manage", "clients.manage", "orders.manage", "store.manage", "chat.manage", "inventory.manage"],
  socia: ["dashboard.view", "products.manage", "orders.manage", "store.manage", "chat.manage"],
  vendedora: ["dashboard.view", "products.manage", "orders.manage", "chat.manage"],
  cliente: [],
};

function normalizeRole(value: string | null | undefined): AccessRole | null {
  const normalized = (value || "").trim().toLowerCase();

  if (normalized === "superadmin") return "superadmin";
  if (normalized === "administrador" || normalized === "admin") return "administrador";
  if (normalized === "duena" || normalized === "dueña") return "duena";
  if (normalized === "vendedora") return "vendedora";
  if (normalized === "socia") return "socia";
  if (normalized === "cliente") return "cliente";

  return null;
}

export function getRoleLabel(role: AccessRole) {
  return roleLabels[role];
}

export function getPermissionsForRole(role: AccessRole) {
  return rolePermissions[role];
}

export function getPermissionLabel(permission: AdminPermission) {
  return permissionLabels[permission];
}

export function hasPermission(role: AccessRole, permission: AdminPermission) {
  return getPermissionsForRole(role).includes(permission);
}

export function canAccessAdmin(role: AccessRole) {
  return role !== "cliente";
}

export function getRedirectPathForRole(role: AccessRole) {
  if (role === "cliente") return "/perfil";
  if (role === "superadmin") return "/admin/usuarios";
  if (role === "vendedora") return "/admin/vendedora";
  if (role === "administrador") return "/admin";
  if (role === "duena") return "/admin";
  if (role === "socia") return "/admin";

  return "/perfil";
}

export function resolveRoleFromContext(input: {
  email?: string | null;
  metadataRole?: string | null;
  profileRole?: string | null;
  isAdmin?: boolean;
  superAdminEmail?: string | null;
}): AccessRole {
  const userEmail = (input.email || "").trim().toLowerCase();
  const superAdminEmail = (input.superAdminEmail || "").trim().toLowerCase();

  if (superAdminEmail && userEmail === superAdminEmail) {
    return "superadmin";
  }

  const fromProfile = normalizeRole(input.profileRole);
  if (fromProfile) {
    return fromProfile;
  }

  const fromMetadata = normalizeRole(input.metadataRole);
  if (fromMetadata) {
    return fromMetadata;
  }

  if (input.isAdmin) {
    return "duena";
  }

  return "cliente";
}
