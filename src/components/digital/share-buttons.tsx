"use client";

import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";

// lucide ya no incluye logos de marcas: ícono simple de Facebook.
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
    </svg>
  );
}

// Compartir la página del producto (no el archivo): WhatsApp, Facebook, copiar enlace
// y el menú nativo del celular cuando está disponible.
export function ShareButtons({ url, title, text }: { url: string; title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);
  const message = `${text}\n${url}`;

  async function handleNativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // El usuario canceló el menú de compartir.
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  }

  const buttonClass =
    "inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compartir</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        <MessageCircle className="size-3.5" /> WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        <FacebookIcon className="size-3.5" /> Facebook
      </a>
      <button type="button" onClick={handleCopy} className={buttonClass}>
        {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
        {copied ? "Copiado" : "Copiar enlace"}
      </button>
      {canNativeShare ? (
        <button type="button" onClick={handleNativeShare} className={`${buttonClass} sm:hidden`}>
          <Share2 className="size-3.5" /> Más
        </button>
      ) : null}
    </div>
  );
}
