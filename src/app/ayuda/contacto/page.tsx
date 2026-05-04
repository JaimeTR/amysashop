import ContactForm from '../../../components/ayuda/contact-form';
import { Clock3, Mail, Phone } from 'lucide-react';
import { DEFAULT_WHATSAPP_DISPLAY_PHONE, DEFAULT_WHATSAPP_PHONE } from '@/lib/whatsapp';

export default function ContactoPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/45 p-6 shadow-[0_24px_80px_rgba(117,82,63,0.12)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(166,118,92,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.35))]" />
        <div className="relative">
          <h1 className="font-[var(--font-display)] text-3xl">Contacto</h1>
          <p className="mt-2 text-sm text-muted-foreground">¿Tienes dudas? Escríbenos o usa los datos de contacto.</p>

          <section className="mt-6 grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 rounded-[1.5rem] border border-white/60 bg-white/65 p-6 shadow-sm backdrop-blur-md">
              <h2 className="text-lg font-semibold">Envíanos un mensaje</h2>
              <p className="text-sm text-muted-foreground">Responderemos a la brevedad.</p>
              <div className="mt-4">
                <ContactForm />
              </div>
            </div>

            <aside className="space-y-6 rounded-[1.5rem] border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md">
              <h2 className="text-lg font-semibold">Datos de contacto</h2>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <a href={`tel:+${DEFAULT_WHATSAPP_PHONE}`} className="text-sm text-primary">{DEFAULT_WHATSAPP_DISPLAY_PHONE}</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Correo</p>
                  <a href="mailto:contacto@amysashop.com" className="text-sm text-primary">contacto@amysashop.com</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Horario de atención</p>
                  <p className="text-sm text-muted-foreground">Lunes a Viernes, 9:00 - 18:00</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Síguenos en redes sociales</p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://www.instagram.com/amysa.shop/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-2 text-sm text-foreground transition hover:border-primary/30 hover:text-primary"
                    aria-label="Instagram"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <InstagramIcon className="h-4 w-4" />
                    </span>
                    Instagram
                  </a>
                  <a
                    href="https://www.tiktok.com/@amysa.shop"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-2 text-sm text-foreground transition hover:border-primary/30 hover:text-primary"
                    aria-label="TikTok"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <TikTokIcon className="h-4 w-4" />
                    </span>
                    TikTok
                  </a>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 3v9.2a4.8 4.8 0 1 1-4.2-4.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 3c.7 2.5 2.4 4 5 4v3.3c-2.1 0-3.9-.7-5-1.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
