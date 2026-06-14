import { Wrench, Clock } from "lucide-react";
import Link from "next/link";

export function MaintenanceScreen() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf7f4]">
      <div className="text-center px-4 max-w-md mx-auto">
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-primary/10 text-primary mb-6">
          <Wrench className="size-10" />
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground mb-3">
          Estamos en mantenimiento
        </h1>

        <p className="text-muted-foreground mb-2">
          Nuestro equipo esta realizando mejoras en la plataforma.
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8 flex items-center justify-center gap-1.5">
          <Clock className="size-4" />
          Volveremos pronto. Gracias por tu paciencia.
        </p>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground/50">
            Si necesitas contactarnos, escribenos a:
          </p>
          <Link
            href="https://wa.me/51965312386"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            WhatsApp: 965 312 386
          </Link>
        </div>

        <p className="mt-12 text-xs text-muted-foreground/30">
          AMYSA SHOP &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
