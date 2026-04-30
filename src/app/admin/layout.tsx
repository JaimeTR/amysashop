import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireAdminUser("dashboard.view");

  return <AdminShell role={role}>{children}</AdminShell>;
}
