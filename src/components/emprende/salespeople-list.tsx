"use client";

import { useState, useEffect } from "react";
import {
  getAllSalespeople,
  updateSalesperson,
  getSalespersonStats,
} from "@/lib/actions/emprende-actions";
import { SalespersonWithStats } from "@/lib/types";

export default function SalespeopleList() {
  const [salespeople, setSalespeople] = useState<SalespersonWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<number>(5);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSalespeople();
  }, []);

  const fetchSalespeople = async () => {
    setLoading(true);
    try {
      const data = await getAllSalespeople();
      const withStats = await Promise.all(
        data.map(async (sp) => ({
          ...sp,
          ...(await getSalespersonStats(sp.id)),
        }))
      );
      setSalespeople(withStats);
    } catch (err) {
      setError("Error al cargar vendedoras");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCommission = (id: string, currentCommission: number) => {
    setEditingId(id);
    setEditingCommission(currentCommission);
    setError("");
    setSuccess("");
  };

  const handleSaveCommission = async (id: string) => {
    if (editingCommission < 0 || editingCommission > 100) {
      setError("La comisión debe estar entre 0 y 100%");
      return;
    }

    try {
      const updated = await updateSalesperson(id, {
        commission_percentage: editingCommission,
      });

      if (updated) {
        setSalespeople((prev) =>
          prev.map((sp) =>
            sp.id === id
              ? { ...sp, commission_percentage: editingCommission }
              : sp
          )
        );
        setSuccess("Comisión actualizada");
        setEditingId(null);
      }
    } catch (err) {
      setError("Error al actualizar comisión");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const updated = await updateSalesperson(id, {
        status: newStatus as "active" | "inactive",
      });

      if (updated) {
        setSalespeople((prev) =>
          prev.map((sp) => (sp.id === id ? { ...sp, status: newStatus } : sp))
        );
        setSuccess(`Vendedora ${newStatus === "active" ? "activada" : "desactivada"}`);
      }
    } catch (err) {
      setError("Error al cambiar estado");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Gestionar Vendedoras</h2>

      {error && (
        <div className="mb-4 p-3 bg-destructive text-destructive-foreground rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-success text-success-foreground rounded">
          {success}
        </div>
      )}

      {salespeople.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay vendedoras registradas
        </div>
      ) : (
        <div className="space-y-4">
          {salespeople.map((salesperson) => (
            <div
              key={salesperson.id}
              className="border rounded-lg p-4 hover:shadow transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{salesperson.name}</h3>
                  <p className="text-sm text-gray-600">{salesperson.email}</p>
                  <p className="text-sm text-gray-600">{salesperson.phone}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      salesperson.status === "active" ? "bg-success/10 text-success-foreground" : "bg-destructive/10 text-destructive-foreground"
                    }`}
                  >
                    {salesperson.status === "active" ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded">
                <div>
                  <p className="text-xs text-gray-600">Ventas (mes)</p>
                  <p className="text-lg font-bold">
                    ${salesperson.month_total_amount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Comisiones (mes)</p>
                  <p className="text-lg font-bold text-success-foreground">
                    ${salesperson.month_commission_amount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Transacciones</p>
                  <p className="text-lg font-bold">
                    {salesperson.month_sales_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">% Comisión</p>
                  {editingId === salesperson.id ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editingCommission}
                      onChange={(e) =>
                        setEditingCommission(parseFloat(e.target.value) || 0)
                      }
                      className="border rounded px-2 py-1 w-16 text-lg font-bold"
                    />
                  ) : (
                    <p className="text-lg font-bold">
                      {salesperson.commission_percentage}%
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {editingId === salesperson.id ? (
                  <>
                    <button
                      onClick={() =>
                        handleSaveCommission(salesperson.id)
                      }
                      className="flex-1 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primary/90"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        handleEditCommission(
                          salesperson.id,
                          salesperson.commission_percentage
                        )
                      }
                      className="flex-1 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primary/90"
                    >
                      Editar %
                    </button>
                    <button
                      onClick={() =>
                        handleToggleStatus(salesperson.id, salesperson.status)
                      }
                      className={`flex-1 px-4 py-2 rounded font-medium ${
                          salesperson.status === "active" ? "bg-warning text-white hover:bg-warning/90" : "bg-success text-white hover:bg-success/90"
                        }`}
                    >
                      {salesperson.status === "active"
                        ? "Desactivar"
                        : "Activar"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
