"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Boxes, ClipboardList, LayoutGrid, MessageCircleMore, Settings2, TrendingUp, Users2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { type AccessRole } from "@/lib/access-control";

type Props = {
  role: AccessRole;
  children: React.ReactNode;
};

const mobilePrimaryLinks = [
  { href: "/admin", label: "Resumen", icon: LayoutGrid },
  { href: "/admin/productos", label: "Productos", icon: Boxes },
  { href: "/admin/inventario", label: "Inventario", icon: TrendingUp },
  { href: "/admin/clientes", label: "Clientes", icon: Users2 },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/chats", label: "Chats", icon: MessageCircleMore },
];

export function AdminShell({ role, children }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Módulos principales del admin (para evitar que Resumen se active en subrutas)
  const adminModules = [
    "/admin/productos",
    "/admin/inventario",
    "/admin/caja-amysa",
    "/admin/clientes",
    "/admin/pedidos",
    "/admin/chats",
    "/admin/tienda",
    "/admin/marketing",
    "/admin/usuarios",
  ];

  const isActive = (href: string) => {
    // Si es el dashboard (/admin), solo es activo si no estamos en otro módulo
    if (href === "/admin") {
      const isInOtherModule = adminModules.some(
        (module) => pathname !== href && pathname.startsWith(module)
      );
      return (pathname === href || pathname === href + "/") && !isInOtherModule;
    }
    
    // Para otros módulos, es activo si coincide exactamente o es una subruta
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
        <AdminSidebar
          role={role}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <section className="min-w-0">{children}</section>
      </div>

      <nav className="glass-card fixed inset-x-3 bottom-3 z-40 rounded-2xl px-2 py-1.5 md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {mobilePrimaryLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-[10px] font-semibold transition ${
                  active
                    ? "bg-primary/20 text-primary"
                    : "text-foreground/85 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
