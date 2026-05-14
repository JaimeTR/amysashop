import Image from "next/image";
import Link from "next/link";

const socialIconClassName = "size-5";

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-[#503525] text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center text-center">
            <Image src="/logos/amysa-square-primary.png" alt="AMYSA" width={96} height={96} className="size-24 object-contain sm:size-28" />
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium">Catálogo</h4>
              <ul className="text-sm opacity-90 space-y-1">
                <li>
                  <Link href="/perfil" className="hover:underline">Cuenta</Link>
                </li>
                <li>
                  <Link href="/favoritos" className="hover:underline">Favoritos</Link>
                </li>
                <li>
                  <Link href="/carrito" className="hover:underline">Carrito</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Ayuda</h4>
              <ul className="text-sm opacity-90 space-y-1">
                <li>
                  <Link href="/ayuda/contacto" className="hover:underline">Contacto</Link>
                </li>
                <li>
                  <Link href="/ayuda/faq" className="hover:underline">Preguntas frecuentes</Link>
                </li>
                <li>
                  <Link href="/ayuda/envios-devoluciones" className="hover:underline">Envíos y devoluciones</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm opacity-90 text-center">
          © {new Date().getFullYear()} AMYSA SHOP. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
