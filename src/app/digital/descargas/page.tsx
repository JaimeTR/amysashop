"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Download, Eye, FileArchive, FileSpreadsheet, FileText, FileVideo, File, Loader2, Search } from "lucide-react";
import { DIGITAL_FILE_KIND_LABELS, formatFileSize, getDigitalFileKind, type DigitalFileKind } from "@/lib/digital-types";

type PurchaseFile = {
  id: string;
  name: string;
  description: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  productName: string;
};

type Purchase = {
  id: string;
  code: string;
  productName: string;
  productSlug: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  confirmedAt: string | null;
  downloadToken: string | null;
  files?: PurchaseFile[];
};

const FILE_ICONS: Partial<Record<DigitalFileKind, typeof File>> = {
  excel: FileSpreadsheet,
  pdf: FileText,
  word: FileText,
  zip: FileArchive,
  video: FileVideo,
};

function buildDownloadUrl(email: string, token: string, fileId: string, preview = false) {
  const params = new URLSearchParams({ token, email, file: fileId });
  if (preview) params.set("preview", "1");
  return `/api/digital/download?${params.toString()}`;
}

export default function DigitalDescargasPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);

  async function searchPurchases(searchEmail: string, searchToken: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchEmail.trim())) return;
    setLoading(true);
    try {
      const response = await fetch("/api/digital/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: searchEmail.trim().toLowerCase(), token: searchToken || undefined }),
      });
      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch {
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }

  // El enlace del correo trae ?token=...&email=...; con eso se desbloquean los archivos.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token") || "";
    const urlEmail = params.get("email") || "";
    if (urlToken && urlEmail) {
      setToken(urlToken);
      setEmail(urlEmail);
      void searchPurchases(urlEmail, urlToken);
    }
  }, []);

  return (
    <div className="min-h-[70vh] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">AMYSA SHOP</p>
          <h1 className="mt-3 font-[var(--font-display)] text-2xl text-foreground sm:text-3xl">Mis descargas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Abre el enlace que te enviamos por correo al confirmar tu pago, o ingresa tu correo para ver el estado de tus pedidos.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void searchPurchases(email, token);
            }}
            className="mx-auto mt-6 flex max-w-sm gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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

        {!loading && purchases !== null ? (
          <div className="mt-6 space-y-4">
            {purchases.length === 0 ? (
              <div className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur">
                <AlertCircle className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 font-semibold text-foreground">No encontramos pedidos con este correo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verifica el correo o{" "}
                  <Link href="/digital" className="font-semibold text-primary underline">
                    mira nuestros productos digitales
                  </Link>
                  .
                </p>
              </div>
            ) : (
              purchases.map((purchase) => (
                <div key={purchase.id} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-xl backdrop-blur sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-[var(--font-display)] text-lg font-semibold text-foreground">{purchase.productName}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Pedido {purchase.code} ·{" "}
                        {new Date(purchase.createdAt).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    {purchase.status === "completed" ? (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success-strong">
                        <CheckCircle2 className="size-3" /> Pagado
                      </span>
                    ) : purchase.status === "pending" ? (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning-strong">
                        <Clock className="size-3" /> Pendiente de pago
                      </span>
                    ) : (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                        Cancelado
                      </span>
                    )}
                  </div>

                  {purchase.status === "completed" ? (
                    purchase.downloadToken && purchase.files ? (
                      <ul className="mt-4 grid gap-3">
                        {purchase.files.map((file) => {
                          const kind = getDigitalFileKind(file.name, file.mimeType);
                          const Icon = FILE_ICONS[kind] || File;
                          const canPreview = kind === "pdf" || kind === "imagen" || kind === "video";
                          return (
                            <li
                              key={file.id}
                              className="flex flex-col gap-2 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:gap-3"
                            >
                              <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
                                <Icon className="size-6 shrink-0 text-primary" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {DIGITAL_FILE_KIND_LABELS[kind]}
                                    {file.sizeBytes ? ` · ${formatFileSize(file.sizeBytes)}` : ""}
                                    {file.description ? ` · ${file.description}` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 sm:shrink-0">
                                {canPreview ? (
                                  <a
                                    href={buildDownloadUrl(email, purchase.downloadToken!, file.id, true)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                                  >
                                    <Eye className="size-3.5" /> Ver
                                  </a>
                                ) : null}
                                <a
                                  href={buildDownloadUrl(email, purchase.downloadToken!, file.id)}
                                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                                >
                                  <Download className="size-3.5" /> Descargar
                                </a>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Por seguridad, usa el enlace de descarga que te enviamos a tu correo para acceder a los archivos.
                      </p>
                    )
                  ) : purchase.status === "pending" ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Estamos verificando tu pago. Te enviaremos un correo cuando esté confirmado.
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
