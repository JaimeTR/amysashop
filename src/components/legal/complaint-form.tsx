"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

const inputClass = "w-full rounded-xl border border-[#e7d9cf] bg-white/95 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2";

function Field({ label, required, children, className = "" }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={`space-y-1 text-sm ${className}`}>
      <span className="font-semibold text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

export function ComplaintForm() {
  const [isMinor, setIsMinor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; createdAt: string; emailSent: boolean } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/libro-reclamaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, isMinor, accepted: form.get("accepted") === "on" }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo registrar tu reclamo.");
      setResult({ code: data.code, createdAt: data.createdAt, emailSent: data.emailSent });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar tu reclamo.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <section className="glass-card space-y-3 rounded-3xl p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto size-10 text-success-strong" />
        <h2 className="font-[var(--font-display)] text-2xl">Reclamo registrado</h2>
        <p className="text-sm text-muted-foreground">
          Número de hoja: <strong className="text-foreground">{result.code}</strong> · {result.createdAt}
        </p>
        <p className="text-sm text-muted-foreground">
          {result.emailSent
            ? "Te enviamos una copia a tu correo. Guárdala como constancia."
            : "Guarda este número como constancia; no pudimos enviar la copia por correo en este momento."}{" "}
          Te responderemos en un plazo máximo de 15 días hábiles.
        </p>
        <Link href="/" className="inline-block text-sm font-semibold text-primary hover:underline">
          Volver al inicio
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-6 rounded-3xl p-5 sm:p-8">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">1. Identificación del consumidor</legend>
        <Field label="Nombres y apellidos" required className="sm:col-span-2">
          <input name="consumerName" required className={inputClass} autoComplete="name" />
        </Field>
        <Field label="Tipo de documento" required>
          <select name="documentType" className={inputClass} defaultValue="DNI">
            <option value="DNI">DNI</option>
            <option value="CE">Carné de extranjería</option>
            <option value="Pasaporte">Pasaporte</option>
            <option value="RUC">RUC</option>
          </select>
        </Field>
        <Field label="Número de documento" required>
          <input name="documentNumber" required minLength={6} className={inputClass} />
        </Field>
        <Field label="Domicilio" required className="sm:col-span-2">
          <input name="address" required className={inputClass} autoComplete="street-address" />
        </Field>
        <Field label="Teléfono">
          <input name="phone" type="tel" className={inputClass} autoComplete="tel" />
        </Field>
        <Field label="Correo electrónico" required>
          <input name="email" type="email" required className={inputClass} autoComplete="email" />
        </Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={isMinor} onChange={(event) => setIsMinor(event.target.checked)} /> Soy menor de edad
        </label>
        {isMinor ? (
          <Field label="Nombre del padre, madre o apoderado" required className="sm:col-span-2">
            <input name="guardianName" required className={inputClass} />
          </Field>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">2. Identificación del bien contratado</legend>
        <Field label="Tipo" required>
          <select name="itemType" className={inputClass} defaultValue="producto">
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </select>
        </Field>
        <Field label="Monto reclamado (S/)">
          <input name="amount" type="number" min="0" step="0.01" className={inputClass} />
        </Field>
        <Field label="Descripción del producto o servicio" required className="sm:col-span-2">
          <input name="itemDescription" required className={inputClass} />
        </Field>
        <Field label="N.° de pedido (si lo tienes)" className="sm:col-span-2">
          <input name="orderReference" className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-lg font-semibold">3. Detalle de la reclamación</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="complaintType" value="reclamo" defaultChecked /> <strong>Reclamo</strong> (sobre el producto o servicio)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="complaintType" value="queja" /> <strong>Queja</strong> (sobre la atención)
          </label>
        </div>
        <Field label="Detalle" required>
          <textarea name="detail" required minLength={10} className={`${inputClass} min-h-32`} />
        </Field>
        <Field label="Pedido del consumidor (qué solución esperas)" required>
          <textarea name="consumerRequest" required className={`${inputClass} min-h-24`} />
        </Field>
      </fieldset>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="accepted" required className="mt-1" />
        <span>
          Declaro que los datos consignados son verdaderos y autorizo su tratamiento para atender mi reclamo, según la{" "}
          <Link href="/legal/privacidad" className="font-semibold text-primary underline" target="_blank">
            Política de privacidad
          </Link>
          .
        </span>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Enviar reclamo
      </button>
    </form>
  );
}
