"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotify } from "@/components/feedback/notification-center";

type Props = {
  ok?: string;
  error?: string;
};

function titleFromMessage(msg: string): string {
  if (!msg) return "Éxito";
  const lower = msg.toLowerCase();
  if (lower.includes("verific") || lower.includes("correo") || lower.includes("confirm")) {
    if (lower.includes("verific")) return "Correo de verificación enviado";
    return "Correo enviado";
  }
  if (lower.includes("eliminad")) return "Eliminado";
  if (lower.includes("cliente") && lower.includes("cre")) return "Cliente creado";
  if (lower.includes("producto") && lower.includes("clon")) return "Producto clonado";
  if (lower.includes("producto") && lower.includes("eliminad")) return "Producto eliminado";
  if (lower.includes("producto")) return "Producto guardado";
  if (lower.includes("pedido")) return "Pedido registrado";
  // fallback: use the first capitalized sentence of the message or a generic success
  return msg.split(".")[0].slice(0, 60) || "Éxito";
}

export function AdminPageNotifications({ ok, error }: Props) {
  const notify = useNotify();
  const pathname = usePathname();
  const router = useRouter();
  const query = useSearchParams();

  useEffect(() => {
    if (ok) {
      const text = String(ok || "");
      const lower = text.toLowerCase();

      const title = titleFromMessage(text);
      const desc = text.trim() === title.trim() || text.toLowerCase().startsWith(title.toLowerCase()) ? "" : text;

      if (lower.includes("verific")) {
        notify.verification(title, desc || "Correo de verificación enviado correctamente");
      } else {
        notify.success(title, desc || undefined);
      }
    }

    if (error) {
      notify.error("No se pudo guardar", error);
    }

    if (ok || error) {
      const next = new URLSearchParams(query.toString());
      next.delete("ok");
      next.delete("error");
      const nextQuery = next.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }
  }, [ok, error, notify, pathname, query, router]);

  return null;
}
