"use client";

import { useState, useEffect } from "react";
import { getSalesByMonth, getAllSalesByMonth } from "@/lib/actions/emprende-actions";
import { SaleWithDetails } from "@/lib/types";

interface SalesTableProps {
  salespersonId?: string;
  month?: number;
  year?: number;
  onRefresh?: boolean;
}

export default function SalesTable({
  salespersonId,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  onRefresh,
}: SalesTableProps) {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  const fetchSales = async () => {
    setLoading(true);
    try {
      let data;
      if (salespersonId) {
        data = await getSalesByMonth(salespersonId, selectedMonth, selectedYear);
      } else {
        data = await getAllSalesByMonth(selectedMonth, selectedYear);
      }
      setSales(data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedMonth, selectedYear, salespersonId, onRefresh]);

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

  const totalAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalCommission = sales.reduce(
    (sum, sale) => sum + (sale.commission_amount || 0),
    0
  );
  const completedPayments = sales.filter(
    (s) => s.payment_status === "completed"
  ).length;

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Pagado</span>;
      case "partial":
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Parcial</span>;
      case "pending":
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Pendiente</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getCommissionBadge = (paymentStatus: string) => {
    if (paymentStatus !== "completed") {
      return <span className="text-red-600 text-xs">Sin comisión</span>;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Registro de Ventas</h2>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
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
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Vendido</p>
          <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Comisiones</p>
          <p className="text-2xl font-bold">${totalCommission.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">Pagos Completados</p>
          <p className="text-2xl font-bold">{completedPayments}</p>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : sales.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay ventas registradas en este período
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Producto</th>
                {!salespersonId && <th className="text-left px-4 py-2">Vendedora</th>}
                <th className="text-center px-4 py-2">Cantidad</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-right px-4 py-2">Pago</th>
                <th className="text-right px-4 py-2">Comisión</th>
                <th className="text-center px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{sale.product?.name}</td>
                  {!salespersonId && (
                    <td className="px-4 py-2">{sale.salesperson?.name}</td>
                  )}
                  <td className="text-center px-4 py-2">{sale.quantity}</td>
                  <td className="text-right px-4 py-2">
                    ${sale.total_amount.toFixed(2)}
                  </td>
                  <td className="text-right px-4 py-2">
                    <div>${sale.payment_received.toFixed(2)}</div>
                    {getPaymentStatusBadge(sale.payment_status)}
                  </td>
                  <td className="text-right px-4 py-2">
                    <div className="font-medium">
                      ${sale.commission_amount.toFixed(2)}
                    </div>
                    {getCommissionBadge(sale.payment_status)}
                  </td>
                  <td className="text-center px-4 py-2">
                    {getPaymentStatusBadge(sale.payment_status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
