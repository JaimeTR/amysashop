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
      <div className="rounded-lg bg-gradient-to-br from-amber-50 via-white to-white/70 p-8 shadow-md">
        <h1 className="font-[var(--font-display)] text-3xl">Preguntas frecuentes</h1>
        <p className="mt-2 text-sm text-muted-foreground">Encuentra respuestas rápidas sobre envíos, pagos y garantías.</p>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((f, i) => (
            <FaqItem key={i} question={f.q} answer={f.a} />
          ))}
        </section>
      </div>
    </main>
  );
}
