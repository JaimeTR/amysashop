"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CommissionsDashboard from "@/components/emprende/commissions-dashboard";
import SalesForm from "@/components/emprende/sales-form";
import SalesTable from "@/components/emprende/sales-table";
import ExternalClientForm from "@/components/emprende/external-client-form";
import EmpendeAdminDashboard from "@/components/emprende/admin-dashboard";
import { getSalesperson } from "@/lib/actions/emprende-actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Product, Salesperson } from "@/lib/types";

export default function EmprenderPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [salesperson, setSalesperson] = useState<Salesperson | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "sales" | "clients"
  >("dashboard");

  const [refreshSales, setRefreshSales] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Obtener usuario actual
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);

        // Obtener perfil
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        setProfile(profileData);

        // Validar rol
        if (profileData?.role === "admin") {
          router.push("/admin/emprende");
          return;
        }

        // Obtener vendedor
        const salespersonData = await getSalesperson(currentUser.id);

        if (!salespersonData) {
          router.push("/");
          return;
        }

        setSalesperson(salespersonData);

        // Obtener productos
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("active", true);

        setProducts(productsData || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }

  return (
    <AdminShell role={profile?.role || "user"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Emprende</h1>

          <p className="text-muted-foreground">
            Panel de gestión de ventas y comisiones
          </p>
        </div>

        {salesperson && (
          <>
            <CommissionsDashboard salespersonId={salesperson.id} />

            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2 rounded ${
                  activeTab === "dashboard"
                    ? "bg-black text-white"
                    : "bg-muted/95"
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab("sales")}
                className={`px-4 py-2 rounded ${
                  activeTab === "sales"
                    ? "bg-black text-white"
                    : "bg-muted/95"
                }`}
              >
                Ventas
              </button>

              <button
                onClick={() => setActiveTab("clients")}
                className={`px-4 py-2 rounded ${
                  activeTab === "clients"
                    ? "bg-black text-white"
                    : "bg-muted/95"
                }`}
              >
                Clientes
              </button>
            </div>

            {activeTab === "dashboard" && (
              <SalesTable salespersonId={salesperson.id} />
            )}

            {activeTab === "sales" && (
              <SalesForm
                salespersonId={salesperson.id}
                products={products}
                onSaleCreated={() => setRefreshSales(!refreshSales)}
              />
            )}

            {activeTab === "clients" && (
              <ExternalClientForm salespersonId={salesperson.id} />
            )}
          </>
        )}

        {profile?.role === "admin" && <EmpendeAdminDashboard />}
      </div>
    </AdminShell>
  );
}