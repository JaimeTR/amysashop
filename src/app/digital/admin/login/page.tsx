"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DigitalAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_ANON_KEY;
      console.log("DIGITAL_URL:", url, "DIGITAL_KEY_PREVIEW:", key?.substring(0, 20));
      const supabase = createClient(url!, key!);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        console.error("Supabase auth error:", signInError);
        setError(signInError.message || "Credenciales inválidas");
      } else {
        console.log("Login OK, session:", data.session?.user?.email);
        router.push("/digital/admin");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
        <h1 className="mt-3 text-center font-[var(--font-display)] text-2xl">Admin Digital</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Inicia sesión para gestionar descargas</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4" suppressHydrationWarning>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              required
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Contraseña</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm outline-none ring-primary/30 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center">
          <p className="text-xs text-muted-foreground">
            <Link href="/digital/ambarcastro" className="text-primary underline">Volver a tienda digital</Link>
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Usa <strong>amysashop@gmail.com</strong> con tu contraseña
          </p>
        </div>
      </div>
    </main>
  );
}
