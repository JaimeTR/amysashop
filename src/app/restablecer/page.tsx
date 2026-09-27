"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// Destino del enlace del correo de recuperación. El cliente de Supabase procesa
// el ?code= (PKCE) o el #access_token (enlace enviado desde el admin) y crea la sesión.
export default function RestablecerPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setReady(true);
      }
    });

    async function checkSession() {
      // getSession espera a que el cliente termine de procesar el enlace (detectSessionInUrl).
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setReady(true);
      } else {
        setInvalidLink(true);
      }
    }

    void checkSession();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/perfil");
    router.refresh();
  };

  return (
    <main className="relative flex min-h-[calc(100vh-12rem)] items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(174,130,109,0.25),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(145,114,93,0.2),_transparent_55%)]" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="glass-card rounded-3xl border border-white/40 p-6 shadow-xl sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">AMYSA SHOP</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl leading-tight text-foreground">Nueva contraseña</h1>
          </div>

          {invalidLink ? (
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <p>El enlace no es válido o ya expiró.</p>
              <Link href="/recuperar" className="font-semibold text-primary hover:underline">
                Solicitar un nuevo enlace
              </Link>
            </div>
          ) : !ready ? (
            <p className="text-center text-sm text-muted-foreground">Verificando enlace...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {[
                { id: "new-password", label: "Nueva contraseña", value: password, set: setPassword },
                { id: "confirm-password", label: "Repite la contraseña", value: confirm, set: setConfirm },
              ].map((field) => (
                <label key={field.id} htmlFor={field.id} className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">{field.label}</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={field.id}
                      type="password"
                      autoComplete="new-password"
                      value={field.value}
                      onChange={(event) => field.set(event.target.value)}
                      required
                      className="h-11 rounded-xl border-[#e7d9cf] bg-white/95 pl-10"
                    />
                  </div>
                </label>
              ))}

              <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={loading}>
                {loading ? "Guardando..." : "Guardar contraseña"}
              </Button>

              {message ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
                  {message}
                </div>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
