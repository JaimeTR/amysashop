import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies y almacenamiento del navegador usa AMYSA SHOP y cómo gestionarlos.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de cookies"
      intro="Las cookies y el almacenamiento local son pequeños archivos que se guardan en tu navegador. En AMYSA SHOP los usamos solo para que la tienda funcione correctamente."
    >
      <h2>1. Qué usamos</h2>
      <ul>
        <li>
          <strong>Cookies de sesión (necesarias):</strong> mantienen tu sesión iniciada de forma segura (proveedor: Supabase). Sin ellas no
          podrías ingresar a tu cuenta.
        </li>
        <li>
          <strong>Almacenamiento local (funcional):</strong> guarda tu carrito y tus favoritos en tu navegador para que no se pierdan al
          recargar la página.
        </li>
        <li>
          <strong>Caché de la aplicación (funcional):</strong> la web puede instalarse como aplicación y guarda archivos e imágenes para
          cargar más rápido.
        </li>
      </ul>
      <p>
        Actualmente <strong>no usamos cookies publicitarias ni de seguimiento de terceros</strong>. Si en el futuro las incorporamos, te
        pediremos tu consentimiento previamente.
      </p>

      <h2>2. Cómo gestionarlas</h2>
      <p>
        Puedes borrar o bloquear las cookies y el almacenamiento local desde la configuración de tu navegador. Ten en cuenta que, si lo
        haces, se cerrará tu sesión y se vaciarán tu carrito y tus favoritos.
      </p>

      <h2>3. Más información</h2>
      <p>Para saber cómo tratamos tus datos personales, revisa nuestra Política de privacidad.</p>
    </LegalPage>
  );
}
