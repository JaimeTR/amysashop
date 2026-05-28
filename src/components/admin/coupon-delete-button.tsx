"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDeleteModal } from "@/components/feedback/confirm-delete-modal";

type Props = {
  couponId: number;
  couponCode: string;
  deleteCouponAction: (formData: FormData) => Promise<void>;
};

export function CouponDeleteButton({ couponId, couponCode, deleteCouponAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    const formData = new FormData();
    formData.set("id", String(couponId));
    await deleteCouponAction(formData);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center rounded-md border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/20 hover:text-primary"
        aria-label={`Eliminar cupón ${couponCode}`}
      >
        <Trash2 className="mr-2 size-4" /> Eliminar
      </button>

      <ConfirmDeleteModal
        isOpen={isOpen}
        title="Eliminar cupón"
        message="¿Seguro que deseas eliminar este cupón? Esta acción no se puede deshacer."
        itemName={couponCode}
        isLoading={isDeleting}
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => {
          setIsDeleting(false);
          setIsOpen(false);
        }}
      />
    </>
  );
}
