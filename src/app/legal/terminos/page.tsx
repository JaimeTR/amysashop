import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ProviderData } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de compra, pagos, envíos, productos digitales, cambios y devoluciones de AMYSA SHOP.",
  alternates: { canonical: "/legal/terminos" },
};

export default function TerminosPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      intro="Al navegar y comprar en AMYSA SHOP aceptas estos términos. Te recomendamos leerlos antes de realizar un pedido."
    >
      <h2>1. Datos del proveedor</h2>
      <ProviderData />

      <h2>2. Productos y precios</h2>
      <ul>
        <li>Los precios se muestran en soles (S/) e incluyen los impuestos aplicables. El costo de envío se muestra por separado antes de confirmar el pedido.</li>
        <li>Las imágenes son referenciales; la presentación del producto puede variar según el lote del fabricante.</li>
        <li>Las ofertas y cupones son válidos hasta agotar stock o hasta la fecha indicada, y no son acumulables salvo que se indique lo contrario.</li>
        <li>Si un producto se agota después de tu pedido, te lo informaremos y podrás elegir otro producto o la devolución de tu dinero.</li>
      </ul>

      <h2>3. Pedidos y pagos</h2>
      <ul>
        <li>Puedes hacer tu pedido desde el checkout de la web o por WhatsApp.</li>
        <li>Aceptamos Yape, Plin y transferencia bancaria. El pedido se confirma cuando verificamos el pago.</li>
        <li>Nos reservamos el derecho de cancelar pedidos con datos incorrectos o pagos no verificados, devolviendo lo abonado.</li>
      </ul>

      <h2>4. Envíos</h2>
      <p>
        Realizamos envíos a Lima Metropolitana y a provincias (a través de Shalom). Las tarifas y plazos vigentes se detallan en{" "}
        <Link href="/ayuda/envios-devoluciones" className="font-semibold text-primary underline">Envíos y devoluciones</Link>. Los plazos
        pueden variar por causas ajenas a nosotros (clima, operador logístico, feriados).
      </p>

      <h2>5. Cambios y devoluciones</h2>
      <p>
        Aceptamos cambios y devoluciones dentro de los 7 días siguientes a la recepción por producto defectuoso, error en el pedido o
        producto distinto al solicitado. El producto debe estar sin uso y en su empaque original. Esto no limita los derechos que te
        otorga el Código de Protección y Defensa del Consumidor (Ley N.° 29571).
      </p>

      <h2>6. Productos digitales</h2>
      <ul>
        <li>Los productos digitales (plantillas, libros, guías, cursos y packs) se entregan mediante un enlace de descarga enviado al correo indicado, una vez confirmado el pago.</li>
        <li>La compra otorga una licencia de uso personal. No está permitido revender, redistribuir, publicar ni compartir los archivos.</li>
        <li>
          Por su naturaleza, una vez enviado el enlace de descarga no se aceptan devoluciones, salvo que el archivo esté dañado, no
          corresponda a lo ofrecido o no puedas acceder a él; en esos casos te enviaremos el archivo correcto o devolveremos tu dinero.
        </li>
        <li>Los contenidos son de propiedad de sus autores y están protegidos por las normas de derechos de autor.</li>
      </ul>

      <h2>7. Cuenta de usuario</h2>
      <p>Eres responsable de mantener la confidencialidad de tu contraseña y de la información de tu cuenta. Avísanos si detectas un uso no autorizado.</p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        La marca AMYSA SHOP, el diseño y los contenidos de la web son de nuestra propiedad o se usan con autorización. Las marcas de los
        productos pertenecen a sus respectivos titulares.
      </p>

      <h2>9. Reclamos</h2>
      <p>
        Si tienes un reclamo o queja, puedes registrarlo en nuestro{" "}
        <Link href="/libro-de-reclamaciones" className="font-semibold text-primary underline">Libro de Reclamaciones virtual</Link>. Te
        responderemos en un plazo máximo de 15 días hábiles.
      </p>

      <h2>10. Datos personales</h2>
      <p>
        Tratamos tus datos conforme a nuestra{" "}
        <Link href="/legal/privacidad" className="font-semibold text-primary underline">Política de privacidad</Link>.
      </p>

      <h2>11. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República del Perú.</p>
    </LegalPage>
  );
}
