import FaqItem from '../../../components/ayuda/faq-item';

const faqs = [
  {
    q: '¿Cuáles son los métodos de pago disponibles?',
    a: (
      <p>
        Aceptamos tarjetas de crédito y débito (Visa, Mastercard), pago por transferencia y pago contra entrega en zonas habilitadas.
      </p>
    ),
  },
  {
    q: '¿Cuánto tarda el envío?',
    a: (
      <p>
        Los envíos nacionales suelen demorar entre 2 y 5 días hábiles, dependiendo de la ubicación. Para consultas específicas, contáctanos por teléfono o correo.
      </p>
    ),
  },
  {
    q: '¿Cuál es la política de devoluciones?',
    a: (
      <p>
        Aceptamos devoluciones dentro de los 7 días siguientes a la recepción por productos defectuosos o errores en el pedido. Es necesario presentar comprobante y comunicarse con soporte.
      </p>
    ),
  },
  {
    q: '¿Ofrecen garantía en los productos?',
    a: (
      <p>
        Sí, varios productos cuentan con garantía del fabricante. La duración y alcance varían por artículo; revisa la ficha del producto o pregunta al equipo de soporte.
      </p>
    ),
  },
  {
    q: '¿Puedo hacer seguimiento de mi pedido?',
    a: (
      <p>
        Sí, una vez despachado el pedido te enviaremos el número de seguimiento por correo para que puedas consultar el estado en la web del transportista.
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/45 p-6 shadow-[0_24px_80px_rgba(117,82,63,0.12)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(166,118,92,0.2),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.68),rgba(255,255,255,0.32))]" />
        <div className="relative">
          <h1 className="font-[var(--font-display)] text-3xl">Preguntas frecuentes</h1>
          <p className="mt-2 text-sm text-muted-foreground">Encuentra respuestas rápidas sobre envíos, pagos y garantías.</p>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((f, i) => (
              <FaqItem key={i} question={f.q} answer={f.a} />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
