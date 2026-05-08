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
import { Product, Salesperson } from "@/lib/types";

export default function EmprenderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [salesperson, setSalesperson] = useState<Salesperson | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "sales" | "clients">(
    "dashboard"
  );
  const [refreshSales, setRefreshSales] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminSalespeople, setAdminSalespeople] = useState<Salesperson[]>([]);
  const [adminSelectedSalespersonId, setAdminSelectedSalespersonId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUser(currentUser);

        // Get user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(profileData);

        // Check if user is salesperson or admin
        if (
          profileData?.role === "admin" ||
          profileData?.role === "superadmin" ||
          profileData?.role === "owner"
        ) {
          // Admin/Owner - no need to fetch salesperson data
          setSalesperson(null);
          // Fetch salespeople list for admin actions
          const { data: salespeopleData } = await supabase
            .from("salespeople")
            .select("*")
            .order("created_at", { ascending: false });
          setAdminSalespeople(salespeopleData || []);
        } else {
          // Check if user is a registered salesperson
          const sp = await getSalesperson(currentUser.id);
          if (!sp) {
            // User is not a salesperson
            router.push("/acceso-restringido");
            return;
          }
          setSalesperson(sp);
        }

        // Fetch products
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("active", true);
        setProducts(productsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSaleCreated = () => {
    setRefreshSales((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";
  const isOwner = profile?.role === "owner";
  const isAdminOrOwner = isAdmin || isOwner;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="glass-card rounded-3xl p-5 mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-[var(--font-display)] text-3xl">Emprende</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAdminOrOwner
                  ? "Gestión de vendedoras y comisiones"
                  : `Bienvenida ${salesperson?.name}, aquí puedes registrar tus ventas y seguimiento de comisiones`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => (isAdminOrOwner ? setAdminModalOpen(true) : setActiveTab("sales"))}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Registrar venta
            </button>
          </div>
        </header>

        {isAdminOrOwner ? (
          <div className="space-y-8">
              {/* Admin Navigation */}
              <div className="bg-white rounded-lg shadow">
                <div className="flex gap-4 p-6 border-b">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2 rounded font-medium ${
                      activeTab === "dashboard"
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab("sales")}
                    className={`px-4 py-2 rounded font-medium ${
                      activeTab === "sales"
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Todas las Ventas
                  </button>
                  <button
                    onClick={() => setAdminModalOpen(true)}
                    className="px-4 py-2 rounded font-medium bg-primary text-white hover:bg-primary/90"
                  >
                    Registrar Venta
                  </button>
                </div>
              </div>

              {/* Admin Content */}
              {activeTab === "dashboard" && <EmpendeAdminDashboard />}

              {activeTab === "sales" && (
                <div>
                  <SalesTable month={new Date().getMonth() + 1} />
                </div>
              )}

              {adminModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Registrar Venta (Admin)</h3>
                      <button
                        onClick={() => setAdminModalOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cerrar
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Selecciona Vendedora</label>
                      <select
                        value={adminSelectedSalespersonId}
                        onChange={(e) => setAdminSelectedSalespersonId(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Selecciona una vendedora</option>
                        {adminSalespeople.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} ({sp.email || sp.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    {adminSelectedSalespersonId ? (
                      <SalesForm
                        salespersonId={adminSelectedSalespersonId}
                        products={products}
                        onSaleCreated={() => {
                          setAdminModalOpen(false);
                          handleSaleCreated();
                        }}
                      />
                    ) : (
                      <div className="text-sm text-gray-600">Selecciona una vendedora para continuar.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
        ) : (
          // Salesperson View
          <div className="space-y-8">
            {/* Salesperson Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="flex gap-4 p-6 border-b overflow-x-auto">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 rounded font-medium whitespace-nowrap ${
                    activeTab === "dashboard"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Mi Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("sales")}
                  className={`px-4 py-2 rounded font-medium whitespace-nowrap ${
                    activeTab === "sales"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Registrar Venta
                </button>
                <button
                  onClick={() => setActiveTab("clients")}
                  className={`px-4 py-2 rounded font-medium whitespace-nowrap ${
                    activeTab === "clients"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Clientes
                </button>
              </div>
            </div>

            {/* Salesperson Content */}
            {activeTab === "dashboard" && salesperson && (
              <div className="space-y-6">
                <CommissionsDashboard salespersonId={salesperson.id} />
                <SalesTable
                  salespersonId={salesperson.id}
                  onRefresh={refreshSales}
                />
              </div>
            )}

            {activeTab === "sales" && salesperson && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SalesForm
                    salespersonId={salesperson.id}
                    products={products}
                    onSaleCreated={handleSaleCreated}
                  />
                </div>
                <div>
                  <div className="bg-primary/5 border border-primary/30 rounded-lg p-6">
                    <h3 className="font-bold mb-4">Instrucciones</h3>
                    <ul className="space-y-2 text-sm">
                      <li>✓ Selecciona el producto que vendiste</li>
                      <li>✓ Indica la cantidad vendida</li>
                      <li>✓ Registra el estado del pago</li>
                      <li>✓ Tu comisión aparecerá automáticamente</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "clients" && salesperson && (
              <ExternalClientForm salespersonId={salesperson.id} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
