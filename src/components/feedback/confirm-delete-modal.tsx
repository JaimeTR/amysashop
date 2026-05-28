"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { useEffect, useState, useRef } from "react";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  itemName,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [mounted, setMounted] = useState(false);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [mounted]);

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-primary/20 bg-white/95 shadow-2xl backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-primary/10 bg-primary/5 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary p-3 shadow-sm">
              <AlertTriangle className="size-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Alerta de confirmación</p>
              <h2 id="confirm-delete-title" className="mt-1 font-[var(--font-display)] text-xl text-foreground">
                {title}
              </h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={isLoading}
              className="shrink-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div id="confirm-delete-desc" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-foreground shadow-sm">
            <p className="font-medium text-foreground">{message}</p>
            {itemName && (
              <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-primary ring-1 ring-primary/15">
                {itemName}
              </p>
            )}
          </div>

          <div className="flex gap-2 border-t border-primary/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 border-primary/20 text-primary hover:bg-primary/5"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-primary text-white hover:bg-primary/90"
              ref={confirmRef}
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
