"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const handleDelete = async (message: MessageRow) => {
    const confirmed = window.confirm(`¿Eliminar este mensaje? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      setIsDeletingId(message.id);
      const formData = new FormData();
      formData.set("id", String(message.id));
      await deleteMessageAction(formData);
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setIsDeletingId(null);
    }
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
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {message.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3">
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
                  className="inline-flex h-9 items-center rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
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
    </div>
  );
}
