import Link from "next/link";
import { getRedirectPathForRole, type AccessRole } from "@/lib/access-control";

type SearchParams = {
  reason?: string;
  role?: string;
};

export default function AccesoRestringidoPage({ searchParams }: { searchParams?: SearchParams }) {
  const isPermissionReason = searchParams?.reason === "permission";
  const role = String(searchParams?.role || "").trim().toLowerCase() as AccessRole | "";
  const isClient = role === "cliente" || !role;
  const primaryHref = isClient ? "/" : getRedirectPathForRole(role as AccessRole);
  const primaryLabel = isClient ? "Ir al inicio" : "Ir a mi panel";
  const roleLabelMap: Record<string, string> = {
    superadmin: "superadministración",
    administrador: "administración",
    duena: "dirección",
    vendedora: "vendedora",
    socia: "sociedad",
    cliente: "cliente",
  };
  const roleLabel = roleLabelMap[role] || "perfil";
  const title = isPermissionReason ? "Acceso restringido" : "Página restringida para tu perfil";
  const message = isPermissionReason
    ? "La página a la que intentas ingresar está restringida para tu perfil o no tienes permisos suficientes."
    : "La página a la que intentas ingresar está restringida para tu perfil.";
  const specificMessage = isClient
    ? "Si no encuentras lo que buscas, vuelve al inicio o entra al catálogo para seguir navegando."
    : `Tu acceso como ${roleLabel} está limitado a tu panel asignado.`;

  return (
    <main className="min-h-[70vh] px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,242,0.96))] p-8 text-center shadow-[0_18px_55px_rgba(110,71,49,0.10)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-foreground">{title}</h1>
        <p className="mt-4 text-base text-muted-foreground">{message}</p>
        <p className="mt-2 text-sm font-medium text-primary/90">{specificMessage}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={primaryHref} className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">
            {primaryLabel}
          </Link>
          <Link href="/tienda" className="inline-flex items-center justify-center rounded-xl border border-primary/20 bg-white px-5 py-3 text-sm font-semibold text-primary">
            Ir al catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}
