import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { CATEGORY_PAGES } from "@/lib/category-pages";

const columns: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Tienda",
    links: [
      { href: "/tienda", label: "Catálogo completo" },
      ...CATEGORY_PAGES.slice(0, 3).map((page) => ({ href: `/tienda/${page.slug}`, label: page.title.replace(/ y fragancias$/, "") })),
      { href: "/tienda?descuento=true", label: "Ofertas" },
    ],
  },
  {
    title: "Digitales",
    links: [
      { href: "/digital", label: "Productos digitales" },
      { href: "/digital/ambarcastro", label: "Plantillas de Excel" },
      { href: "/digital/descargas", label: "Mis descargas" },
    ],
  },
  {
    title: "Mi cuenta",
    links: [
      { href: "/perfil", label: "Cuenta" },
      { href: "/favoritos", label: "Favoritos" },
      { href: "/carrito", label: "Carrito" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { href: "/ayuda/contacto", label: "Contacto" },
      { href: "/ayuda/faq", label: "Preguntas frecuentes" },
      { href: "/ayuda/envios-devoluciones", label: "Envíos y devoluciones" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-[#503525] text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="flex flex-col items-center gap-3 text-center lg:max-w-[240px] lg:items-start lg:text-left">
            <Image src="/logos/amysa-square-primary.png" alt="AMYSA SHOP" width={140} height={48} className="h-12 w-auto object-contain" />
            <p className="text-sm opacity-80">
              Perfumes, maquillaje y cuidado personal de marcas de catálogo, y productos digitales para emprendedoras. Envíos a todo el Perú.
            </p>
          </div>

          <nav aria-label="Pie de página" className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h4 className="mb-2 font-medium">{column.title}</h4>
                <ul className="space-y-1 text-sm opacity-90">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-sm opacity-90 sm:flex-row">
          <p>© {new Date().getFullYear()} AMYSA SHOP. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            <Heart className="size-3.5" aria-hidden="true" /> By Ambar Castro
          </p>
        </div>
      </div>
    </footer>
  );
}
