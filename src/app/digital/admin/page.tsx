"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createDigitalClient } from "@/lib/supabase/digital-client";
import { CheckCircle2, Loader2, RefreshCw, Mail, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Purchase = {
  id: string;
  email: string;
  customer_name: string;
  product_name: string;
  status: string;
  payment_method: string;
  amount: number;
  currency: string;
  created_at: string;
  confirmed_at: string | null;
};

export default function DigitalAdminPage() {
  const [session, setSession] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createDigitalClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        router.replace("/digital/admin/login");
      } else {
        setSession(true);
        setToken(s.access_token);
      }
    });
  }, [router]);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/digital/admin/list", { headers: headers() });
      const data = await res.json();
      if (data.ok) {
        setPurchases(data.purchases);
      }
    } catch {
      console.error("Failed to fetch purchases");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (session) {
      fetchPurchases();
    }
  }, [session, fetchPurchases]);

  const handleConfirm = async (purchaseId: string) => {
    setConfirmingId(purchaseId);
    try {
      const res = await fetch("/api/digital/admin/confirm", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ purchase_id: purchaseId }),
      });
      const data = await res.json();
      if (data.ok) {
        setPurchases((prev) =>
          prev.map((p) =>
            p.id === purchaseId
              ? { ...p, status: "completed", confirmed_at: new Date().toISOString() }
              : p
          )
        );
      }
    } catch {
      console.error("Failed to confirm purchase");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleLogout = async () => {
    const supabase = createDigitalClient();
    await supabase.auth.signOut();
    router.push("/digital/admin/login");
  };

  if (session === null) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  const pendingCount = purchases.filter((p) => p.status === "pending").length;
  const completedCount = purchases.filter((p) => p.status === "completed").length;

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 pb-8">
      <header className="glass-card flex items-center justify-between rounded-3xl p-5">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl">Descargas digitales</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifica pagos y gestiona las descargas de productos digitales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={fetchPurchases} disabled={loading}>
            <RefreshCw className={`mr-1 size-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1 size-4" />
            Salir
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pendientes de verificar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-warning">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-success">{completedCount}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay compras registradas aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4 font-semibold">Cliente</th>
                    <th className="pb-3 pr-4 font-semibold">Email</th>
                    <th className="pb-3 pr-4 font-semibold">Producto</th>
                    <th className="pb-3 pr-4 font-semibold">Monto</th>
                    <th className="pb-3 pr-4 font-semibold">Método</th>
                    <th className="pb-3 pr-4 font-semibold">Fecha</th>
                    <th className="pb-3 pr-4 font-semibold">Estado</th>
                    <th className="pb-3 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium">{purchase.customer_name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{purchase.email}</td>
                      <td className="py-3 pr-4">{purchase.product_name}</td>
                      <td className="py-3 pr-4">
                        {purchase.currency === "PEN" ? "S/" : "$"}
                        {Number(purchase.amount).toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">{purchase.payment_method}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(purchase.created_at).toLocaleDateString("es-PE")}
                      </td>
                      <td className="py-3 pr-4">
                        {purchase.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                            <CheckCircle2 className="size-3" />
                            Completado
                          </span>
                        ) : purchase.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                            Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                            Cancelado
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {purchase.status === "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={confirmingId === purchase.id}
                            onClick={() => handleConfirm(purchase.id)}
                          >
                            {confirmingId === purchase.id ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : (
                              <Mail className="mr-1 size-3" />
                            )}
                            Confirmar y enviar
                          </Button>
                        ) : purchase.status === "completed" && purchase.confirmed_at ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(purchase.confirmed_at).toLocaleDateString("es-PE")}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
