import ContactForm from '../../../components/ayuda/contact-form';
import { Phone, Mail } from 'lucide-react';

export default function ContactoPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="rounded-lg bg-gradient-to-br from-amber-50 via-white to-white/70 p-8 shadow-md">
        <h1 className="font-[var(--font-display)] text-3xl">Contacto</h1>
        <p className="mt-2 text-sm text-muted-foreground">¿Tienes dudas? Escríbenos o usa los datos de contacto.</p>

        <section className="mt-6 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 rounded-lg bg-white/70 p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Envíanos un mensaje</h2>
            <p className="text-sm text-muted-foreground">Responderemos a la brevedad.</p>
            <div className="mt-4">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Datos de contacto</h2>

            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Teléfono</p>
                <a href="tel:+51965312386" className="text-sm text-primary">965 312 386</a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Correo</p>
                <a href="mailto:contacto@amysashop.com" className="text-sm text-primary">contacto@amysashop.com</a>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">Horario de atención: Lunes a Viernes, 9:00 - 18:00</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
