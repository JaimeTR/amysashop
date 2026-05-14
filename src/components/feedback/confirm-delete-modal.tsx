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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-desc"
        className="w-full max-w-md rounded-3xl border border-destructive/50 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-destructive p-3">
            <AlertTriangle className="size-6 text-destructive-foreground" />
          </div>
          <div className="flex-1">
            <h2 id="confirm-delete-title" className="font-[var(--font-display)] text-xl font-semibold text-foreground">
              {title}
            </h2>
            <p id="confirm-delete-desc" className="mt-2 text-sm text-foreground/80">{message}</p>
            {itemName && (
              <p className="mt-2 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground">
                {itemName}
              </p>
            )}
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

        <div className="flex gap-2 border-t border-destructive/30 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-destructive text-white hover:bg-destructive/80"
            ref={confirmRef}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
