"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotify } from "@/components/feedback/notification-center";
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole, resolveRoleFromContext } from "@/lib/access-control";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const notify = useNotify();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  function isEmailNotConfirmedError(rawMessage: string) {
    const normalized = String(rawMessage || "").toLowerCase();
    return normalized.includes("email not confirmed") || normalized.includes("email no confirmado");
  }

  async function handleResendConfirmation() {
    const safeEmail = email.trim().toLowerCase();

    if (!safeEmail) {
      notify.warning("Correo requerido", "Ingresa tu correo para reenviar la confirmación.");
      return;
    }

    setResendLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: safeEmail,
    });

    if (error) {
      notify.error("No se pudo reenviar", error.message);
      setResendLoading(false);
      return;
    }

    notify.success("Correo reenviado", "Te enviamos un nuevo correo de confirmación.");
    setMessage("Correo de confirmación reenviado. Revisa tu bandeja de entrada o spam.");
    setResendLoading(false);
  }

  function openGmail() {
    window.open("https://mail.google.com/mail/u/0/#inbox", "_blank", "noopener,noreferrer");
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setEmailNotConfirmed(false);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (isEmailNotConfirmedError(error.message)) {
        setEmailNotConfirmed(true);
        setMessage("Email no confirmado. Revisa tu correo y confirma tu cuenta para ingresar.");
        notify.warning("Email no confirmado", "Confirma tu cuenta o solicita un nuevo correo de verificación.");
      } else {
        setMessage(error.message);
      }
      setLoading(false);
      return;
    }

    const signedUser = data.user;

    if (!signedUser) {
      setMessage("No se pudo recuperar la sesión. Intenta nuevamente.");
      setLoading(false);
      return;
    }

    const superAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAIL || "").trim().toLowerCase();

    let profileRole: string | null = null;
    let profileIsAdmin = false;

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role,is_admin")
        .eq("id", signedUser.id)
        .maybeSingle();

      profileRole = (profileData as { role?: string | null } | null)?.role ?? null;
      profileIsAdmin = Boolean((profileData as { is_admin?: boolean } | null)?.is_admin);
    } catch {
      // Si falla la lectura de profile por RLS, igual resolvemos con metadata/correo.
    }

    const resolvedRole = resolveRoleFromContext({
      email: signedUser.email,
      metadataRole: (signedUser.user_metadata?.role as string | null | undefined) ?? null,
      profileRole,
      isAdmin: profileIsAdmin,
      superAdminEmail,
    });

    router.push(getRedirectPathForRole(resolvedRole));
    router.refresh();
  };

  return (
    <main className="relative min-h-[72vh] overflow-hidden pb-8 pt-3">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(174,130,109,0.25),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(145,114,93,0.2),_transparent_55%)]" />

      <div className="mx-auto w-full max-w-md">
        <div className="glass-card rounded-3xl border border-white/40 p-6 shadow-xl sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">AMYSA SHOP</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl leading-tight text-foreground">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-muted-foreground">Accede al dashboard con tu correo y contraseña.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Correo</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="correo@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailNotConfirmed) {
                      setEmailNotConfirmed(false);
                    }
                  }}
                  required
                  className="h-11 rounded-xl border-[#e7d9cf] bg-white/95 pl-10"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Contraseña</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tu contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11 rounded-xl border-[#e7d9cf] bg-white/95 pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>

            {message ? <p className="text-sm text-rose-700">{message}</p> : null}

            {emailNotConfirmed ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3">
                <p className="text-sm font-semibold text-amber-800">Email no confirmado</p>
                <p className="mt-1 text-xs text-amber-700">
                  Debes confirmar tu cuenta por correo para poder iniciar sesión.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="border-amber-300 bg-white/90 text-amber-800 hover:bg-white"
                  >
                    {resendLoading ? "Reenviando..." : "Reenviar confirmación"}
                  </Button>
                  <Button type="button" onClick={openGmail} className="bg-amber-700 text-white hover:bg-amber-800">
                    Abrir Gmail
                  </Button>
                </div>
              </div>
            ) : null}
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-semibold text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
