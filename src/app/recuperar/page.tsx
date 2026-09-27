"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

export default function RecuperarPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const safeEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
      setMessage("Ingresa un correo válido que incluya @.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
      redirectTo: `${getSiteUrl().replace(/\/$/, "")}/restablecer`,
    });

    setLoading(false);

    if (error) {
      setMessage("No se pudo enviar el correo. Intenta nuevamente en unos minutos.");
      return;
    }

    // No se indica si el correo existe o no, para no revelar cuentas registradas.
    setSent(true);
  };

  return (
    <main className="relative flex min-h-[calc(100vh-12rem)] items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(174,130,109,0.25),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(145,114,93,0.2),_transparent_55%)]" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="glass-card rounded-3xl border border-white/40 p-6 shadow-xl sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">AMYSA SHOP</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl leading-tight text-foreground">Recuperar contraseña</h1>
            <p className="mt-2 text-sm text-muted-foreground">Te enviaremos un enlace para crear una nueva contraseña.</p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm text-foreground">
              Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <label htmlFor="recover-email" className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Correo</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="recover-email"
                    placeholder="correo@ejemplo.com"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-11 rounded-xl border-[#e7d9cf] bg-white/95 pl-10"
                  />
                </div>
              </label>

              <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>

              {message ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
                  {message}
                </div>
              ) : null}
            </form>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
