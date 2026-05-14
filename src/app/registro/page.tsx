"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleDollarSign, Eye, EyeOff, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

const paymentOptions = [
  { value: "transferencia", label: "Transferencia" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
];

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const siteUrl = getSiteUrl();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          telefono,
          direccion,
          preferred_payment_method: paymentMethod,
        },
        emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/cuenta-verificada`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        nombre,
        telefono,
        direccion,
      });
    }

    setMessage("Registro exitoso. Revisa tu correo para confirmar la cuenta.");
    router.push("/login");
  };

  return (
    <main className="relative min-h-[72vh] overflow-hidden pb-8 pt-3">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(174,130,109,0.25),_transparent_60%),radial-gradient(ellipse_at_bottom,_rgba(145,114,93,0.2),_transparent_55%)]" />

      <div className="mx-auto w-full max-w-md">
        <div className="glass-card rounded-3xl border border-white/40 p-6 shadow-xl sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">AMYSA SHOP</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl leading-tight text-foreground">Crear cuenta</h1>
            <p className="mt-2 text-sm text-muted-foreground">Completa tus datos para registrarte y empezar a comprar.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label htmlFor="registro-nombre" className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Nombre</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="registro-nombre"
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  required
                  className="h-11 rounded-xl border-[#e7d9cf] bg-white/95 pl-10"
                />
              </div>
            </label>

            <label htmlFor="registro-telefono" className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Teléfono</span>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="registro-telefono"
                  placeholder="999 999 999"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  required
                  className="h-11 rounded-xl border-[#e7d9cf] bg-white/95 pl-10"
                />
              </div>
            </label>

            <label htmlFor="registro-direccion" className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Dirección</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="registro-direccion"
                  placeholder="Tu dirección"
                  value={direccion}
                  onChange={(event) => setDireccion(event.target.value)}
                  required
                  className="h-11 rounded-xl border-[#e7d9cf] bg-white/95 pl-10"
                />
              </div>
            </label>

            <label htmlFor="registro-paymentMethod" className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Método de pago preferido</span>
              <div className="relative">
                <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="registro-paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#e7d9cf] bg-white/95 pl-10 pr-3 text-sm"
                  required
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label htmlFor="registro-email" className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Correo</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="registro-email"
                  placeholder="correo@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 rounded-xl border-[#e7d9cf] bg-white/95 pl-10"
                />
              </div>
            </label>

            <label htmlFor="registro-password" className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Contraseña</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="registro-password"
                  placeholder="Mínimo 6 caracteres"
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
              {loading ? "Registrando..." : "Crear cuenta"}
            </Button>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
