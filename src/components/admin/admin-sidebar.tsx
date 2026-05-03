"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Boxes, ClipboardList, HandCoins, LayoutGrid, Menu, MessageCircleMore, Megaphone, Settings2, TrendingUp, UserCog, Users2, X } from "lucide-react";
import { AccessRole, AdminPermission, hasPermission } from "@/lib/access-control";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Resumen", icon: LayoutGrid, permission: "dashboard.view" as AdminPermission },
  { href: "/admin/productos", label: "Productos", icon: Boxes, permission: "products.manage" as AdminPermission },
  { href: "/admin/inventario", label: "Inventario", icon: TrendingUp, permission: "inventory.manage" as AdminPermission },
  { href: "/admin/caja-amysa", label: "Caja", icon: HandCoins, permission: "inventory.manage" as AdminPermission },
  { href: "/admin/clientes", label: "Clientes", icon: Users2, permission: "clients.manage" as AdminPermission },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, permission: "orders.manage" as AdminPermission },
  { href: "/admin/chats", label: "Chats", icon: MessageCircleMore, permission: "chat.manage" as AdminPermission },
  { href: "/admin/tienda", label: "Tienda", icon: Settings2, permission: "store.manage" as AdminPermission },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone, permission: "store.manage" as AdminPermission },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserCog, permission: "users.manage" as AdminPermission },
];

type Props = {
  role: AccessRole;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
};

export function AdminSidebar({ role, collapsed, mobileOpen, onToggleCollapse, onToggleMobile, onCloseMobile }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const visibleLinks = links.filter((link) => hasPermission(role, link.permission));
  const homeHref = role === "vendedora" ? "/admin/vendedora" : "/admin";

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
    "/admin/vendedora",
  ];

  const isActive = (href: string) => {
    const checkHref = href === "/admin" ? homeHref : href;
    
    // Si es el dashboard (/admin), solo es activo si no estamos en otro módulo
    if (checkHref === "/admin" || checkHref === "/admin/vendedora") {
      const isInOtherModule = adminModules.some(
        (module) => pathname !== checkHref && pathname.startsWith(module)
      );
      return (pathname === checkHref || pathname === checkHref + "/") && !isInOtherModule;
    }
    
    // Para otros módulos, es activo si coincide exactamente o es una subruta
    return pathname === checkHref || pathname.startsWith(checkHref + "/");
  };

  const handleLinkClick = (href: string) => {
    onCloseMobile();
    router.push(href);
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-between md:hidden">
        <Button type="button" variant="outline" size="sm" onClick={onToggleMobile}>
          <Menu className="mr-1 size-4" /> Menú
        </Button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[110] bg-black/35 md:hidden" onClick={onCloseMobile} aria-hidden="true" />
      ) : null}

      <aside
        className={`glass-card fixed left-3 top-3 z-[111] h-[calc(100vh-1.5rem)] overflow-y-auto rounded-3xl p-3 transition-transform md:sticky md:top-4 md:z-auto md:h-fit md:translate-x-0 md:overflow-visible md:p-4 ${
          mobileOpen ? "translate-x-0" : "-translate-x-[120%]"
        } ${collapsed ? "md:w-[86px]" : "md:w-[260px]"}`}
      >
        <div className={`mb-3 flex items-center gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? null : (
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={onToggleCollapse} className="hidden md:inline-flex">
              <Menu className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onCloseMobile} className="md:hidden">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <nav className="grid min-w-0 gap-1.5">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const href = link.href === "/admin" ? homeHref : link.href;
            const active = isActive(href);
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => handleLinkClick(href)}
                className={`flex w-full items-center rounded-xl py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary/20 text-primary"
                    : "text-foreground/85 hover:bg-primary/10 hover:text-primary"
                } ${
                  collapsed ? "justify-center px-2" : "gap-2 whitespace-nowrap px-3"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {collapsed ? null : link.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
