"use client";

import { useMemo, useState } from "react";
import { KeyRound, MailCheck, Search, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRoleLabel, type AccessRole } from "@/lib/access-control";
import { ConfirmDeleteModal } from "@/components/feedback/confirm-delete-modal";
import { UserEditModal } from "@/components/admin/user-edit-modal";

type UserRow = {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  direccion: string;
  role: AccessRole;
  isMainSuperadmin: boolean;
  isProtectedSuperadmin: boolean;
  createdAt: string;
  isDisabled: boolean;
  verified: boolean;
};

type Props = {
  rows: UserRow[];
  editableRoles: AccessRole[];
  updateUserDataAction: (formData: FormData) => Promise<void>;
  updateUserRoleAction: (formData: FormData) => void;
  setUserStatusAction: (formData: FormData) => void;
  sendVerificationAction: (formData: FormData) => void;
  sendPasswordResetAction: (formData: FormData) => void;
  deleteUserAction: (formData: FormData) => Promise<void>;
};

export function UsersInventoryTable({
  rows,
  editableRoles,
  updateUserDataAction,
  updateUserRoleAction,
  setUserStatusAction,
  sendVerificationAction,
  sendPasswordResetAction,
  deleteUserAction,
}: Props) {
  const [query, setQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteConfirmUser = useMemo(() => rows.find((row) => row.id === deleteConfirmId) ?? null, [rows, deleteConfirmId]);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("userId", deleteConfirmId);
      await deleteUserAction(formData);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error eliminando usuario:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      const searchable = [
        row.nombre,
        row.email,
        getRoleLabel(row.role),
        row.verified ? "verificado" : "no verificado",
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
        <h3 className="font-semibold text-foreground">Usuarios del sistema</h3>
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, correo, rol, estado o verificación..."
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filteredRows.length} de {rows.length} usuarios
      </p>

      {filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron usuarios con ese criterio.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white/80">
          <table className="min-w-[1320px] w-full text-sm">
            <thead className="bg-[#efe3d8] text-left">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Correo</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Verificado</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Registro</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t align-top">
                  <td className="px-3 py-2">{row.nombre || "Sin nombre"}</td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">
                    {row.isProtectedSuperadmin ? (
                      <span className="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                        {getRoleLabel("superadmin")}
                      </span>
                    ) : (
                      <form action={updateUserRoleAction} className="inline-flex items-center gap-2">
                        <input type="hidden" name="userId" value={row.id} />
                        <select
                          name="role"
                          defaultValue={row.role}
                          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                          onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        >
                          {editableRoles.map((option) => (
                            <option key={option} value={option}>
                              {getRoleLabel(option)}
                            </option>
                          ))}
                        </select>
                      </form>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        row.verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.verified ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        row.isDisabled ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {row.isDisabled ? "Deshabilitado" : "Activo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString("es-PE") : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {row.isProtectedSuperadmin ? (
                      <p className="text-xs text-muted-foreground">Cuenta superadmin protegida.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <UserEditModal user={row} updateUserDataAction={updateUserDataAction} />
                        <form action={sendVerificationAction}>
                          <input type="hidden" name="email" value={row.email} />
                          <Button type="submit" size="icon" variant="outline" className="size-8" title="Enviar verificacion">
                            <MailCheck className="size-4" />
                          </Button>
                        </form>
                        <form action={sendPasswordResetAction}>
                          <input type="hidden" name="email" value={row.email} />
                          <Button type="submit" size="icon" variant="outline" className="size-8" title="Enviar cambio de clave">
                            <KeyRound className="size-4" />
                          </Button>
                        </form>
                        <form action={setUserStatusAction}>
                          <input type="hidden" name="userId" value={row.id} />
                          <input type="hidden" name="action" value={row.isDisabled ? "enable" : "disable"} />
                          <Button
                            type="submit"
                            size="icon"
                            variant="outline"
                            className="size-8"
                            title={row.isDisabled ? "Habilitar" : "Deshabilitar"}
                          >
                            {row.isDisabled ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
                          </Button>
                        </form>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="size-8"
                          title="Eliminar"
                          onClick={() => setDeleteConfirmId(row.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">ID: {row.id}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteConfirmId}
        title="Eliminar usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        itemName={deleteConfirmUser?.email}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
