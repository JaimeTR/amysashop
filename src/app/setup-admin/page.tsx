"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function SetAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
    };
    getUser();
  }, [router]);

  const handleSetAdmin = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al activar admin");
        return;
      }

      // Espera un poco y redirige
      setTimeout(() => router.push("/admin"), 1000);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-warning-foreground font-bold">⏳ Cargando...</h1>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto mt-8 bg-info/10 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Activar Admin</h1>
      <p className="mb-4">
        Email: <strong>{user.email}</strong>
      </p>

      {error && (
        <div className="bg-destructive/10 border border-destructive/80 text-destructive-foreground px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleSetAdmin}
        disabled={loading}
        className="bg-primary text-white px-4 py-2 rounded font-bold hover:bg-primary/90 w-full disabled:opacity-50"
      >
        {loading ? "⏳ Procesando..." : "✓ Convertirme en Admin"}
      </button>
    </div>
  );
}
