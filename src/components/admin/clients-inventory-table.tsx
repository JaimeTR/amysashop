"use client";

import { useMemo, useState } from "react";
import { Search, MailCheck, KeyRound, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientEditModal } from "@/components/admin/client-edit-modal";
import { ConfirmDeleteModal } from "@/components/feedback/confirm-delete-modal";
import { useNotify } from "@/components/feedback/notification-center";

type ClientRow = {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  direccion: string;
  createdAt: string;
  isDisabled: boolean;
};

type Props = {
  rows: ClientRow[];
  updateClientDataAction: (formData: FormData) => Promise<void>;
  setClientStatusAction: (formData: FormData) => void;
  deleteClientAction: (formData: FormData) => void;
  sendVerificationEmailAction: (formData: FormData) => void;
  sendPasswordResetAction: (formData: FormData) => void;
};

export function ClientsInventoryTable({
  rows,
  updateClientDataAction,
  setClientStatusAction,
  deleteClientAction,
  sendVerificationEmailAction,
  sendPasswordResetAction,
}: Props) {
  const notify = useNotify();
  const [query, setQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ clientId: string; clientName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      const searchable = [
        row.nombre,
        row.email,
        row.telefono,
        row.direccion,
        row.isDisabled ? "deshabilitado" : "activo",
        row.createdAt,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [rows, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-foreground">Lista de clientes registrados</h3>
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, correo, teléfono, dirección o estado..."
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filteredRows.length} de {rows.length} clientes
      </p>

      {filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron clientes con ese criterio.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white/80">
          <table className="w-full text-sm">
            <thead className="bg-[#efe3d8] text-left">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Correo</th>
                <th className="px-3 py-2 hidden sm:table-cell">Teléfono</th>
                <th className="px-3 py-2 hidden md:table-cell">Dirección</th>
                <th className="px-3 py-2 hidden lg:table-cell">Estado</th>
                <th className="px-3 py-2 hidden xl:table-cell">Registro</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((client) => (
                <tr key={client.id} className="border-t align-top">
                  <td className="px-3 py-2 font-medium text-xs truncate max-w-[120px]" title={client.nombre || "Sin nombre"}>{client.nombre || "Sin nombre"}</td>
                  <td className="px-3 py-2 text-xs truncate max-w-[150px]" title={client.email || "Sin correo"}>{client.email || "Sin correo"}</td>
                  <td className="px-3 py-2 hidden sm:table-cell text-xs">{client.telefono || "Sin teléfono"}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-xs truncate max-w-[150px]" title={client.direccion || "Sin dirección"}>{client.direccion || "Sin dirección"}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        client.isDisabled ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"
                      }`}
                    >
                      {client.isDisabled ? "Deshabilitado" : "Activo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground hidden xl:table-cell">
                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString("es-PE") : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <ClientEditModal 
                        client={client} 
                        updateClientDataAction={updateClientDataAction}
                        className="h-8 w-8"
                      />
                      <form action={setClientStatusAction}>
                        <input type="hidden" name="userId" value={client.id} />
                        <input type="hidden" name="action" value={client.isDisabled ? "enable" : "disable"} />
                        <Button 
                          type="submit" 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          title={client.isDisabled ? "Habilitar" : "Deshabilitar"}
                        >
                          {client.isDisabled ? <UserCheck className="size-3 sm:size-4" /> : <UserX className="size-3 sm:size-4" />}
                        </Button>
                      </form>
                      <form action={sendVerificationEmailAction}>
                        <input type="hidden" name="email" value={client.email} />
                        <Button 
                          type="submit" 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          title="Enviar verificación"
                        >
                          <MailCheck className="size-3 sm:size-4" />
                        </Button>
                      </form>
                      <form action={sendPasswordResetAction}>
                        <input type="hidden" name="email" value={client.email} />
                        <Button 
                          type="submit" 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          title="Cambiar contraseña"
                        >
                          <KeyRound className="size-3 sm:size-4" />
                        </Button>
                      </form>
                      <Button 
                        type="button"
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8"
                        title="Eliminar"
                        onClick={() => setDeleteConfirm({ clientId: client.id, clientName: client.nombre })}
                      >
                        <Trash2 className="size-3 sm:size-4" />
                      </Button>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">ID: {client.id.slice(0, 8)}...</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteConfirm !== null}
        title="Eliminar cliente"
        message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
        itemName={deleteConfirm?.clientName}
        isLoading={isDeleting}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          setIsDeleting(true);
          try {
            const formData = new FormData();
            formData.set("userId", deleteConfirm.clientId);
            deleteClientAction(formData);
            notify.removed("Cliente eliminado", "El cliente ha sido eliminado correctamente");
            setDeleteConfirm(null);
          } catch (error) {
            notify.error("Error al eliminar", error instanceof Error ? error.message : "No se pudo eliminar el cliente");
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
