"use client";

import { useState, useEffect } from "react";
import {
  getSalespersonStats,
  getTotalCommissionsForMonth,
  getTotalSalesForMonth,
  getPendingCommissions,
} from "@/lib/actions/emprende-actions";
import { SalespersonWithStats } from "@/lib/types";

interface CommissionsDashboardProps {
  salespersonId: string;
}

export default function CommissionsDashboard({
  salespersonId,
}: CommissionsDashboardProps) {
  const [stats, setStats] = useState<SalespersonWithStats | null>(null);
  const [monthlyComissions, setMonthlyComissions] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [pendingComissions, setPendingComissions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [statsData, monthlyCommData, monthlySalesData, pendingCommData] =
          await Promise.all([
            getSalespersonStats(salespersonId, selectedMonth, selectedYear),
            getTotalCommissionsForMonth(salespersonId, selectedMonth, selectedYear),
            getTotalSalesForMonth(salespersonId, selectedMonth, selectedYear),
            getPendingCommissions(salespersonId),
          ]);

        setStats(statsData);
        setMonthlyComissions(monthlyCommData);
        setMonthlySales(monthlySalesData);
        setPendingComissions(pendingCommData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [salespersonId, selectedMonth, selectedYear]);

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

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
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
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas del Mes */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow">
          <p className="text-sm text-blue-600 font-medium mb-1">Ventas del Mes</p>
          <p className="text-3xl font-bold text-blue-900">
            ${monthlySales.toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            {stats?.month_sales_count || 0} transacciones
          </p>
        </div>

        {/* Comisiones del Mes */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow">
          <p className="text-sm text-green-600 font-medium mb-1">
            Comisiones del Mes
          </p>
          <p className="text-3xl font-bold text-green-900">
            ${monthlyComissions.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-2">
            {stats?.commission_percentage || 5}% de comisión
          </p>
        </div>

        {/* Comisiones Pendientes */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg shadow">
          <p className="text-sm text-yellow-600 font-medium mb-1">
            Comisiones Pendientes
          </p>
          <p className="text-3xl font-bold text-yellow-900">
            ${pendingComissions.toFixed(2)}
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            Pendiente de pago de cliente
          </p>
        </div>

        {/* Porcentaje de Comisión */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow">
          <p className="text-sm text-purple-600 font-medium mb-1">
            Tu Comisión
          </p>
          <p className="text-3xl font-bold text-purple-900">
            {stats?.commission_percentage || 5}%
          </p>
          <p className="text-xs text-purple-600 mt-2">
            {stats?.status === "active" ? "Activa" : "Inactiva"}
          </p>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Información General</h3>
        <div className="space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Nombre:</span>
            <span className="font-medium">{stats?.name}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{stats?.email || "No registrado"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Teléfono:</span>
            <span className="font-medium">{stats?.phone || "No registrado"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estado:</span>
            <span
              className={`font-medium ${
                stats?.status === "active"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {stats?.status === "active" ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
