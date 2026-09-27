import type { Metadata } from "next";
import FaqItem from '../../../components/ayuda/faq-item';

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Métodos de pago (Yape, Plin, transferencia), costos de envío a Lima y provincias, tiempos de entrega y devoluciones en AMYSA SHOP.",
  alternates: { canonical: "/ayuda/faq" },
};

// Respuestas en texto plano: se muestran en la página y también en el JSON-LD FAQPage
// (antes el JSON-LD decía "Ver en la página" y no aportaba a Google ni a los buscadores con IA).
// Mantener estos datos alineados con src/lib/delivery-options.ts y src/lib/checkout-settings.ts.
const faqs: Array<{ q: string; a: string }> = [
  {
    q: "¿Cómo hago un pedido?",
    a: "Agrega los productos al carrito y elige \"Ir a checkout\" para completar tus datos y el pago, o \"Enviar pedido por WhatsApp\" para coordinar directamente con nosotros. Te confirmaremos el pedido por WhatsApp.",
  },
  {
    q: "¿Cuáles son los métodos de pago disponibles?",
    a: "Aceptamos Yape, Plin y transferencia bancaria a cuentas BCP, Interbank y BBVA. Los datos de pago se muestran en el checkout al finalizar tu compra.",
  },
  {
    q: "¿Cuánto cuesta el envío?",
    a: "El envío a Lima Metropolitana cuesta S/ 10.00 y el envío a provincias por Shalom cuesta S/ 15.00. También puedes elegir entrega a coordinar con AMYSA en Lima sin costo de envío.",
  },
  {
    q: "¿Cuánto tarda el envío?",
    a: "Preparamos los pedidos en 24 a 48 horas hábiles después de confirmado el pago. La entrega suele tomar entre 2 y 5 días hábiles según la ciudad de destino.",
  },
  {
    q: "¿Hacen envíos a provincias?",
    a: "Sí, enviamos a todo el Perú a través de Shalom con una tarifa fija de S/ 15.00.",
  },
  {
    q: "¿Qué marcas venden?",
    a: "Trabajamos con marcas de catálogo como Ésika, L'Bel, Cyzone y Yanbal, además de productos y packs propios de AMYSA.",
  },
  {
    q: "¿Cuál es la política de devoluciones?",
    a: "Aceptamos cambios y devoluciones dentro de los 7 días siguientes a la recepción por productos defectuosos o errores en el pedido. El producto debe estar sin uso y en su empaque original; comunícate con nosotros por WhatsApp.",
  },
  {
    q: "¿Ofrecen garantía en los productos?",
    a: "Varios productos cuentan con garantía del fabricante. La duración y el alcance varían por artículo; revisa la ficha del producto o consulta con nuestro equipo.",
  },
  {
    q: "¿Puedo hacer seguimiento de mi pedido?",
    a: "Sí. Cuando tu pedido sea despachado te compartiremos el código de seguimiento por WhatsApp o correo para que consultes su estado.",
  },
];

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/45 p-6 shadow-[0_24px_80px_rgba(117,82,63,0.12)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(166,118,92,0.2),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.68),rgba(255,255,255,0.32))]" />
        <div className="relative">
          <h1 className="font-[var(--font-display)] text-3xl">Preguntas frecuentes</h1>
          <p className="mt-2 text-sm text-muted-foreground">Encuentra respuestas rápidas sobre envíos, pagos y garantías.</p>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((f, i) => (
              <FaqItem key={i} question={f.q} answer={<p>{f.a}</p>} />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
