"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Video, FileIcon, Loader2, Search, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

type DigitalFile = {
  name: string;
  description: string;
  url: string;
  type: "excel" | "pdf" | "video" | "other";
};

type Purchase = {
  id: string;
  email: string;
  customer_name: string;
  product_name: string;
  product_slug: string;
  status: "pending" | "completed" | "cancelled";
  download_token: string | null;
  created_at: string;
  confirmed_at: string | null;
  files?: DigitalFile[];
};

function FileIconDisplay({ type }: { type: string }) {
  if (type === "excel") return <FileSpreadsheet className="size-5 text-emerald-600" />;
  if (type === "pdf") return <FileText className="size-5 text-red-500" />;
  if (type === "video") return <Video className="size-5 text-blue-500" />;
  return <FileIcon className="size-5 text-muted-foreground" />;
}

export default function DigitalDescargasPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch("/api/digital/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch {
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl text-foreground">Descarga tus archivos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa el correo que usaste al comprar para acceder a tus plantillas y guías.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-6 flex max-w-sm gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Buscar
            </button>
          </form>
        </div>

        {searched && !loading && purchases !== null && (
          <div className="mt-6 space-y-3">
            {purchases.length === 0 ? (
              <div className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur">
                <AlertCircle className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 font-semibold text-foreground">No encontramos compras con este correo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verifica que ingresaste el correo correcto o{" "}
                  <Link href="/digital/ambarcastro" className="font-semibold text-primary underline">
                    adquiere una plantilla
                  </Link>
                  .
                </p>
              </div>
            ) : (
              purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-xl backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground">{purchase.product_name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(purchase.created_at).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      {purchase.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                          <CheckCircle2 className="size-3" />
                          Verificado
                        </span>
                      ) : purchase.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                          <Clock className="size-3" />
                          Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                          Cancelado
                        </span>
                      )}
                    </div>
                  </div>

                  {purchase.status === "completed" && (
                    <div className="mt-4 space-y-2">
                      {purchase.files && purchase.files.length > 0 ? (
                        purchase.files.map((file, i) => (
                          <a
                            key={i}
                            href={file.url || "#"}
                            download={!!file.url}
                            className={`flex items-center gap-3 rounded-xl border border-border/60 p-3 text-sm transition hover:border-primary/30 hover:bg-primary/5 ${!file.url ? "pointer-events-none opacity-50" : ""}`}
                          >
                            <FileIconDisplay type={file.type} />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.description}</p>
                            </div>
                            {file.url && <Download className="size-4 shrink-0 text-primary" />}
                          </a>
                        ))
                      ) : (
                        <a
                          href={`/digital/descargas?token=${purchase.download_token}&email=${encodeURIComponent(email)}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                          <Download className="size-4" />
                          Descargar {purchase.product_name}
                        </a>
                      )}
                    </div>
                  )}

                  {purchase.status === "pending" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Estamos verificando tu pago. Te enviaremos un correo cuando esté confirmado.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
