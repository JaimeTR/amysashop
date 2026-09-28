import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ProviderData } from "@/components/legal/legal-page";
import { LEGAL_INFO } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo AMYSA SHOP recopila, usa y protege tus datos personales conforme a la Ley N.° 29733 de Protección de Datos Personales del Perú.",
  alternates: { canonical: "/legal/privacidad" },
};

export default function PrivacidadPage() {
  const contact = LEGAL_INFO.email || "nuestro WhatsApp " + LEGAL_INFO.phone;

  return (
    <LegalPage
      title="Política de privacidad"
      intro="En AMYSA SHOP respetamos tu privacidad. Esta política explica qué datos personales tratamos, para qué y cuáles son tus derechos, conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento."
    >
      <h2>1. Responsable del tratamiento</h2>
      <p>El titular del banco de datos personales y responsable de su tratamiento es:</p>
      <ProviderData />

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li>
          <strong>Registro y cuenta:</strong> nombre, correo electrónico, teléfono, dirección, método de pago preferido y foto de perfil (opcional).
        </li>
        <li>
          <strong>Compras y envíos:</strong> nombre, tipo y número de documento, correo, teléfono, dirección de entrega, productos, montos y referencia de pago.
        </li>
        <li>
          <strong>Productos digitales:</strong> nombre, correo, teléfono (opcional), producto adquirido y registro de descargas.
        </li>
        <li>
          <strong>Atención y consultas:</strong> los mensajes que nos envías por el formulario de contacto, el chat de la web o WhatsApp.
        </li>
        <li>
          <strong>Libro de Reclamaciones:</strong> los datos que exige la normativa de protección al consumidor.
        </li>
        <li>
          <strong>Datos técnicos:</strong> cookies y almacenamiento del navegador necesarios para mantener tu sesión, carrito y favoritos (ver{" "}
          <Link href="/legal/cookies" className="font-semibold text-primary underline">Política de cookies</Link>).
        </li>
      </ul>
      <p>No recopilamos datos de tarjetas bancarias: los pagos se realizan por Yape, Plin o transferencia fuera de nuestra web.</p>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Gestionar tu cuenta, tus pedidos, pagos, envíos, cambios y devoluciones.</li>
        <li>Entregar los productos digitales comprados y enviarte los enlaces de descarga.</li>
        <li>Atender tus consultas, reclamos y solicitudes.</li>
        <li>Cumplir obligaciones legales, tributarias y de protección al consumidor.</li>
        <li>
          Con tu consentimiento, enviarte novedades y promociones. Puedes retirarlo en cualquier momento escribiéndonos.
        </li>
      </ul>

      <h2>4. Con quién compartimos tus datos</h2>
      <p>
        No vendemos tus datos. Solo los compartimos con proveedores que nos ayudan a operar la tienda, que actúan por nuestra cuenta y
        bajo obligaciones de confidencialidad:
      </p>
      <ul>
        <li>Supabase (base de datos, autenticación y almacenamiento de archivos).</li>
        <li>Resend (envío de correos transaccionales, como la confirmación de compras digitales).</li>
        <li>Groq (procesamiento de los mensajes del asistente de chat).</li>
        <li>Empresas de transporte, como Shalom, para la entrega de pedidos a provincia.</li>
        <li>WhatsApp (Meta), cuando decides comunicarte con nosotros por ese medio.</li>
        <li>Autoridades competentes, cuando la ley lo exija.</li>
      </ul>
      <p>
        Algunos de estos proveedores almacenan información fuera del Perú (flujo transfronterizo), con niveles de protección adecuados.
        Al usar nuestros servicios aceptas dicha transferencia para las finalidades descritas.
      </p>

      <h2>5. Conservación</h2>
      <p>
        Conservamos tus datos mientras mantengas tu cuenta o sea necesario para las finalidades indicadas y, luego, durante los plazos
        que exigen las normas tributarias y de protección al consumidor (por ejemplo, las hojas del Libro de Reclamaciones se conservan
        como mínimo dos años).
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (ARCO), así como revocar tu consentimiento,
        escribiéndonos a {contact} e indicando tu nombre, documento de identidad y la solicitud. Responderemos dentro de los plazos
        legales. Si consideras que no atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales
        del Ministerio de Justicia y Derechos Humanos.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas para proteger tus datos: conexión cifrada (HTTPS), control de accesos por roles,
        archivos digitales en almacenamiento privado y enlaces de descarga personales.
      </p>

      <h2>8. Menores de edad</h2>
      <p>Nuestros servicios están dirigidos a mayores de 18 años. Los menores deben contar con autorización de sus padres o tutores.</p>

      <h2>9. Cambios en esta política</h2>
      <p>Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su fecha de actualización.</p>
    </LegalPage>
  );
}
