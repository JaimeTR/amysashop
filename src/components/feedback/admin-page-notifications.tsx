"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotify } from "@/components/feedback/notification-center";

type Props = {
  ok?: string;
  error?: string;
};

export function AdminPageNotifications({ ok, error }: Props) {
  const notify = useNotify();
  const pathname = usePathname();
  const router = useRouter();
  const query = useSearchParams();

  useEffect(() => {
    if (ok) {
      const title = ok.toLowerCase().includes("eliminado") ? "Producto eliminado" : "Producto guardado";
      notify.success(title, ok);
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
