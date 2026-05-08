"use client";

import { useState, useEffect } from "react";
import {
  getAllSalespeople,
  getSalespersonStats,
  getAllSalesByMonth,
} from "@/lib/actions/emprende-actions";
import { SalespersonWithStats, SaleWithDetails } from "@/lib/types";

export default function EmpendeAdminDashboard() {
  const [salespeople, setSalespeople] = useState<SalespersonWithStats[]>([]);
  const [allSales, setAllSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSalesperson, setSelectedSalesperson] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const spData = await getAllSalespeople();
      const spWithStats = await Promise.all(
        spData.map(async (sp) => ({
          ...sp,
          ...(await getSalespersonStats(sp.id, selectedMonth, selectedYear)),
        }))
      );
      setSalespeople(spWithStats);

      const salesData = await getAllSalesByMonth(selectedMonth, selectedYear);
      setAllSales(salesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  const years = Array.from({ length: 5 }, (_, i) =>
    new Date().getFullYear() - i
  );

  // Filtrar ventas por vendedora si está seleccionada
  const filteredSales = selectedSalesperson
    ? allSales.filter((s) => s.salesperson_id === selectedSalesperson)
    : allSales;

  // Calcular totales
  const totalSales = filteredSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalCommissions = filteredSales.reduce(
    (sum, s) => sum + (s.commission_amount || 0),
    0
  );
  const completedPayments = filteredSales.filter((s) => s.payment_status === "completed").length;
  const pendingPayments = filteredSales.filter(
    (s) => s.payment_status === "pending" || s.payment_status === "partial"
  ).length;

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Filtros</h3>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vendedora</label>
            <select
              value={selectedSalesperson || ""}
              onChange={(e) => setSelectedSalesperson(e.target.value || null)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todas</option>
              {salespeople.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow">
          <p className="text-sm text-blue-600 font-medium mb-1">Total Vendido</p>
          <p className="text-3xl font-bold text-blue-900">
            ${totalSales.toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 mt-2">Período: {months.find(m => m.value === selectedMonth)?.label}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow">
          <p className="text-sm text-green-600 font-medium mb-1">
            Comisiones a Pagar
          </p>
          <p className="text-3xl font-bold text-green-900">
            ${totalCommissions.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-2">
            {filteredSales.length} transacciones
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow">
          <p className="text-sm text-purple-600 font-medium mb-1">
            Pagos Completados
          </p>
          <p className="text-3xl font-bold text-purple-900">
            {completedPayments}
          </p>
          <p className="text-xs text-purple-600 mt-2">
            {pendingPayments} pendientes
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow">
          <p className="text-sm text-orange-600 font-medium mb-1">
            Vendedoras Activas
          </p>
          <p className="text-3xl font-bold text-orange-900">
            {salespeople.filter((sp) => sp.status === "active").length}
          </p>
          <p className="text-xs text-orange-600 mt-2">
            Total: {salespeople.length}
          </p>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Detalle de Ventas</h3>
        {filteredSales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay ventas registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2">Fecha</th>
                  <th className="text-left px-4 py-2">Vendedora</th>
                  <th className="text-left px-4 py-2">Producto</th>
                  <th className="text-center px-4 py-2">Cantidad</th>
                  <th className="text-right px-4 py-2">Total</th>
                  <th className="text-right px-4 py-2">Comisión</th>
                  <th className="text-center px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{sale.salesperson?.name}</td>
                    <td className="px-4 py-2">{sale.product?.name}</td>
                    <td className="text-center px-4 py-2">{sale.quantity}</td>
                    <td className="text-right px-4 py-2">
                      ${sale.total_amount.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-2 font-medium">
                      ${sale.commission_amount.toFixed(2)}
                    </td>
                    <td className="text-center px-4 py-2">
                      {sale.payment_status === "completed" ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Pagado
                        </span>
                      ) : sale.payment_status === "partial" ? (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                          Parcial
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabla de Vendedoras */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Vendedoras - Estadísticas del Mes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-center px-4 py-2">Estado</th>
                <th className="text-center px-4 py-2">% Comisión</th>
                <th className="text-right px-4 py-2">Ventas</th>
                <th className="text-right px-4 py-2">Comisiones</th>
                <th className="text-center px-4 py-2">Transacciones</th>
              </tr>
            </thead>
            <tbody>
              {salespeople.map((sp) => (
                <tr
                  key={sp.id}
                  className={`border-b hover:bg-gray-50 cursor-pointer ${
                    selectedSalesperson === sp.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() =>
                    setSelectedSalesperson(
                      selectedSalesperson === sp.id ? null : sp.id
                    )
                  }
                >
                  <td className="px-4 py-2 font-medium">{sp.name}</td>
                  <td className="text-center px-4 py-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        sp.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sp.status === "active" ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="text-center px-4 py-2">
                    {sp.commission_percentage}%
                  </td>
                  <td className="text-right px-4 py-2 font-bold">
                    ${sp.month_total_amount?.toFixed(2) || "0.00"}
                  </td>
                  <td className="text-right px-4 py-2 text-green-600 font-bold">
                    ${sp.month_commission_amount?.toFixed(2) || "0.00"}
                  </td>
                  <td className="text-center px-4 py-2">
                    {sp.month_sales_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
