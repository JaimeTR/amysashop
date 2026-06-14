import Link from "next/link";
import Image from "next/image";
import { Heart, Shield } from "lucide-react";

export default function DigitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/digital/ambarcastro" className="flex items-center gap-2">
            <Image
              src="/logos/amysa-horizontal-primary.png"
              alt="AMYSA SHOP"
              width={120}
              height={32}
              className="h-7 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-primary/70 sm:block">
              By Ambar Castro
            </span>

            <Link
              href="/digital/descargas"
              className="rounded-full border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
            >
              Mis descargas
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-primary/10 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Image
                src="/logos/amysa-horizontal-primary.png"
                alt="AMYSA SHOP"
                width={140}
                height={38}
                className="h-8 w-auto"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Plantillas profesionales de Excel para emprendedoras que quieren organizar su negocio.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Productos</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/digital/ambarcastro" className="text-sm text-muted-foreground transition hover:text-primary">
                    Mi Catálogo al Día
                  </Link>
                </li>
                <li>
                  <Link href="/digital/ambarcastro" className="text-sm text-muted-foreground transition hover:text-primary">
                    Gestión de Ventas por Catálogo
                  </Link>
                </li>
                <li>
                  <Link href="/digital/ambarcastro" className="text-sm text-muted-foreground transition hover:text-primary">
                    Gestión de Ventas PRO
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Soporte</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/digital/descargas" className="text-sm text-muted-foreground transition hover:text-primary">
                    Descargar archivos
                  </Link>
                </li>
                <li>
                  <a
                    href="https://wa.me/51965312386"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition hover:text-primary"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <Link href="/" className="text-sm text-muted-foreground transition hover:text-primary">
                    Tienda principal
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-primary/10 pt-6 text-center sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} AMYSA SHOP &mdash; Todos los derechos reservados
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="size-3 text-primary" /> By Ambar Castro
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
