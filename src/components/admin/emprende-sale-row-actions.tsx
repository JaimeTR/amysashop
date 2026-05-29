"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/feedback/confirm-delete-modal";

type SaleActionRow = {
  id: string;
  payment_status?: string | null;
  payment_received?: number | null;
  commission_status?: string | null;
  commission_amount?: number | null;
  notes?: string | null;
};

type Props = {
  sale: SaleActionRow;
  updateSaleAction: (formData: FormData) => void | Promise<void>;
  deleteSaleAction: (formData: FormData) => void | Promise<void>;
};

export function EmprendeSaleRowActions({ sale, updateSaleAction, deleteSaleAction }: Props) {
  const [mounted, setMounted] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(String(sale.payment_status || "pending").toLowerCase());
  const [commissionStatus, setCommissionStatus] = useState(String(sale.commission_status || "pending").toLowerCase());
  const deleteFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setPaymentStatus(String(sale.payment_status || "pending").toLowerCase());
    setCommissionStatus(String(sale.commission_status || "pending").toLowerCase());
  }, [sale.payment_status, sale.commission_status]);

  const editModal = openEdit ? (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-[#f7f3ef] p-5 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Acciones</p>
            <h2 className="font-[var(--font-display)] text-2xl text-foreground">Modificar venta</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpenEdit(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <form action={updateSaleAction} className="space-y-4">
          <input type="hidden" name="saleId" value={sale.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Estado de pago</span>
              <select
                name="paymentStatus"
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="pending">Pendiente</option>
                <option value="partial">Parcial</option>
                <option value="completed">Completado</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Estado de comisión</span>
              <select
                name="commissionStatus"
                value={commissionStatus}
                onChange={(event) => setCommissionStatus(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="paid">Pagado</option>
              </select>
            </label>
          </div>

          {paymentStatus === "partial" ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Monto pagado por el momento</span>
              <input
                type="number"
                name="paymentReceived"
                min="0"
                step="0.01"
                defaultValue={Number(sale.payment_received || 0)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
          ) : (
            <input type="hidden" name="paymentReceived" value={String(Number(sale.payment_received || 0))} />
          )}

          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium text-foreground">Notas / monto pagado</span>
            <span className="text-xs text-muted-foreground">
              Si el pago es parcial, aquí puedes dejar el monto recibido y cualquier comentario sobre la venta.
            </span>
            <textarea
              name="notes"
              defaultValue={sale.notes || ""}
              rows={3}
              placeholder="Ejemplo: S/ 50 recibidos, saldo pendiente."
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="flex gap-3 border-t border-border/70 pt-4">
            <Button type="submit" className="flex-1 bg-primary text-white hover:bg-primary/90">
              Guardar cambios
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenEdit(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const deleteForm = (
    <form ref={deleteFormRef} action={deleteSaleAction} className="hidden">
      <input type="hidden" name="saleId" value={sale.id} />
    </form>
  );

  const deleteModal = (
    <ConfirmDeleteModal
      isOpen={openDelete}
      title="Eliminar venta"
      message="Esta acción eliminará la venta y devolverá el stock del producto."
      itemName={`Venta #${sale.id.slice(0, 8)}`}
      onConfirm={() => deleteFormRef.current?.requestSubmit()}
      onCancel={() => setOpenDelete(false)}
      isLoading={false}
    />
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="size-8" title="Modificar venta" onClick={() => setOpenEdit(true)}>
          <Pencil className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="size-8 border-red-200 text-red-600 hover:bg-red-50" title="Eliminar venta" onClick={() => setOpenDelete(true)}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      {mounted && editModal ? createPortal(editModal, document.body) : null}
      {mounted && deleteModal ? createPortal(deleteForm, document.body) : null}
      {mounted && deleteModal ? createPortal(deleteModal, document.body) : null}
    </>
  );
}
