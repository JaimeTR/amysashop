"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/feedback/confirm-delete-modal";

type MessageRow = {
  id: number;
  message: string;
  sort_order: number;
  active: boolean;
};

type Props = {
  messages: MessageRow[];
  updateMessageAction: (formData: FormData) => Promise<void>;
  deleteMessageAction: (formData: FormData) => Promise<void>;
};

export function PreheaderMessagesList({ messages, updateMessageAction, deleteMessageAction }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isSavingId, setIsSavingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MessageRow | null>(null);
  const deleteFormRef = useRef<HTMLFormElement | null>(null);

  const handleDelete = (message: MessageRow) => {
    setDeleteTarget(message);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setIsDeletingId(deleteTarget.id);
    deleteFormRef.current?.requestSubmit();
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleSaveMessage = async (e: React.FormEvent<HTMLFormElement>, messageId: number) => {
    e.preventDefault();
    
    try {
      setIsSavingId(messageId);
      const formData = new FormData(e.currentTarget);
      await updateMessageAction(formData);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setIsSavingId(null);
    }
  };

  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay mensajes creados.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const isEditing = editingId === message.id;

        if (!isEditing) {
          return (
            <article key={message.id} className="space-y-3 rounded-2xl border bg-white/75 p-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Mensaje</p>
                <p className="whitespace-pre-wrap break-words text-foreground font-medium text-base leading-relaxed">{message.message}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-[auto_1fr_auto]">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Orden</p>
                  <p className="font-medium">{message.sort_order}</p>
                </div>
                <div></div>
                <div className="flex justify-end">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      message.active
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(message.id)}
                >
                  <Pencil className="mr-2 size-4" /> Modificar
                </Button>
                <button
                  type="button"
                  onClick={() => handleDelete(message)}
                  disabled={isDeletingId === message.id}
                  className="inline-flex h-9 items-center rounded-md border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/20 hover:text-primary disabled:opacity-50"
                  aria-label="Eliminar"
                >
                  <Trash2 className="mr-2 size-4" /> Eliminar
                </button>
              </div>
            </article>
          );
        }

        return (
          <form
            key={message.id}
            onSubmit={(e) => handleSaveMessage(e, message.id)}
            className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm"
          >
            <input type="hidden" name="id" value={message.id} />
            <textarea
              name="message"
              defaultValue={message.message}
              rows={2}
              className="w-full rounded-lg border border-input bg-white px-3 py-2"
              required
            />
            <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
              <input
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={message.sort_order}
                className="h-9 rounded-lg border border-input bg-white px-3"
              />
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="active" defaultChecked={message.active} />
                Activo
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={isSavingId === message.id}>
                {isSavingId === message.id ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditingId(null)}
                disabled={isSavingId === message.id}
              >
                Cancelar
              </Button>
            </div>
          </form>
        );
      })}

      <form ref={deleteFormRef} action={deleteMessageAction} className="hidden">
        <input type="hidden" name="id" value={deleteTarget?.id || ""} />
      </form>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar mensaje de preencabezado"
        message="¿Seguro que deseas eliminar este mensaje? Esta acción no se puede deshacer."
        itemName={deleteTarget?.message}
        isLoading={isDeletingId === deleteTarget?.id}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeletingId(null);
          cancelDelete();
        }}
      />
    </div>
  );
}
