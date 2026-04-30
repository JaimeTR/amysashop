"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-rose-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-rose-100 p-3">
            <AlertTriangle className="size-6 text-rose-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-[var(--font-display)] text-xl font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-sm text-foreground/80">{message}</p>
            {itemName && (
              <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
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

        <div className="flex gap-2 border-t border-rose-100 pt-4">
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
            className="flex-1 bg-rose-600 text-white hover:bg-rose-700"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
