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
          <div className="animate-spin rounded-full size-12 border-b-2 border-info/70 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";
  const isOwner = profile?.role === "owner";
  const isAdminOrOwner = isAdmin || isOwner;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      <main className="space-y-8 pb-8">
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
              <div className="glass-card rounded-xl">
                <div className="flex gap-4 p-6 border-b border-white/20">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      activeTab === "dashboard"
                        ? "bg-primary text-white"
                        : "text-foreground/70 hover:bg-white/10"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab("sales")}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      activeTab === "sales"
                        ? "bg-primary text-white"
                        : "text-foreground/70 hover:bg-white/10"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="glass-card rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-semibold">Registrar Venta</h3>
                      <button
                        onClick={() => setAdminModalOpen(false)}
                        className="text-foreground/60 hover:text-foreground transition-colors text-2xl leading-none"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Paso 1: Seleccionar Vendedora */}
                      <div className="space-y-2">
                        <label htmlFor="admin-select-salesperson" className="block text-sm font-semibold text-foreground">Paso 1: Selecciona Vendedora *</label>
                        <select
                          id="admin-select-salesperson"
                          value={adminSelectedSalespersonId}
                          onChange={(e) => setAdminSelectedSalespersonId(e.target.value)}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Selecciona una vendedora</option>
                          {adminSalespeople.map((sp) => (
                            <option key={sp.id} value={sp.id}>
                              {sp.name} ({sp.email || sp.phone})
                            </option>
                          ))}
                        </select>
                        {!adminSelectedSalespersonId && (
                          <p className="text-xs text-muted-foreground">Debes seleccionar una vendedora para continuar.</p>
                        )}
                      </div>

                      {/* Formulario de venta - se muestra cuando se selecciona vendedora */}
                      {adminSelectedSalespersonId && (
                        <div className="border-t border-white/20 pt-6">
                          <SalesForm
                            salespersonId={adminSelectedSalespersonId}
                            products={products}
                            onSaleCreated={() => {
                              setAdminModalOpen(false);
                              setAdminSelectedSalespersonId("");
                              handleSaleCreated();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
        ) : (
          // Salesperson View
          <div className="space-y-8">
            {/* Salesperson Navigation */}
            <div className="glass-card rounded-xl">
              <div className="flex gap-4 p-6 border-b border-white/20 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
                    activeTab === "dashboard"
                      ? "bg-primary text-white"
                      : "text-foreground/70 hover:bg-white/10"
                  }`}
                >
                  Mi Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("sales")}
                  className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
                    activeTab === "sales"
                      ? "bg-primary text-white"
                      : "text-foreground/70 hover:bg-white/10"
                  }`}
                >
                  Registrar Venta
                </button>
                <button
                  onClick={() => setActiveTab("clients")}
                  className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors ${
                    activeTab === "clients"
                      ? "bg-primary text-white"
                      : "text-foreground/70 hover:bg-white/10"
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
                  <div className="glass-card rounded-xl p-6 border border-white/20">
                    <h3 className="font-semibold mb-4 text-foreground">Instrucciones</h3>
                    <ul className="space-y-2 text-sm text-foreground/80">
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
      </main>
    </div>
  );
}
