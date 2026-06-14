"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Video, FileIcon, Loader2, Search, AlertCircle, CheckCircle2, Clock, Eye } from "lucide-react";
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

function FileIconDisplay({ type, className }: { type: string; className?: string }) {
  if (type === "excel") return <FileSpreadsheet className={`${className || "size-5"} text-emerald-600`} />;
  if (type === "pdf") return <FileText className={`${className || "size-5"} text-red-500`} />;
  if (type === "video") return <Video className={`${className || "size-5"} text-blue-500`} />;
  return <FileIcon className={`${className || "size-5"} text-muted-foreground`} />;
}

function getFileUrl(email: string, token: string, fileName: string, preview?: boolean): string {
  let url = `/api/digital/download?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  if (fileName) url += `&file=${encodeURIComponent(fileName)}`;
  if (preview) url += "&preview=1";
  return url;
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
    <main className="min-h-[70vh] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
          <h1 className="mt-3 font-[var(--font-display)] text-2xl text-foreground sm:text-3xl">Descarga tus archivos</h1>
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
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </form>
        </div>

        {searched && !loading && purchases !== null && (
          <div className="mt-6 space-y-4">
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
                  className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-xl backdrop-blur sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-[var(--font-display)] text-lg font-semibold text-foreground">{purchase.product_name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(purchase.created_at).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {purchase.status === "completed" ? (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                        <CheckCircle2 className="size-3" />
                        Verificado
                      </span>
                    ) : purchase.status === "pending" ? (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                        <Clock className="size-3" />
                        Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                        Cancelado
                      </span>
                    )}
                  </div>

                  {purchase.status === "completed" && (
                    <div className="mt-4 grid gap-3 sm:mt-5">
                      {purchase.files && purchase.files.length > 0 ? (
                        purchase.files.map((file, i) => {
                          const dlUrl = purchase.download_token
                            ? getFileUrl(email, purchase.download_token, file.name)
                            : "#";
                          return (
                            <div
                              key={i}
                              className="flex flex-col gap-2 rounded-xl border border-border/60 p-3 transition hover:border-primary/30 sm:flex-row sm:items-center sm:gap-3"
                            >
                              <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
                                <FileIconDisplay type={file.type} className="size-5 shrink-0 sm:size-6" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{file.description}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 sm:shrink-0">
                                {file.type === "pdf" && (
                                  <a
                                    href={purchase.download_token ? getFileUrl(email, purchase.download_token, file.name, true) : "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                                  >
                                    <Eye className="size-3.5" />
                                    Vista previa
                                  </a>
                                )}
                                <a
                                  href={dlUrl}
                                  download
                                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                                >
                                  <Download className="size-3.5" />
                                  Descargar
                                </a>
                              </div>
                            </div>
                          );
                        })
                      ) : purchase.download_token ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-muted-foreground">Descarga todos los archivos de este producto:</p>
                          <div className="flex gap-2">
                            <a
                              href={getFileUrl(email, purchase.download_token, "")}
                              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                              <Download className="size-4" />
                              Descargar todo
                            </a>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {purchase.status === "pending" && (
                    <p className="mt-3 text-xs text-muted-foreground">
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
