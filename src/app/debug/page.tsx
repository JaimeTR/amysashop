import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function DebugPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await supabase
        .from("profiles")
        .select("id, is_admin, nombre")
        .eq("id", user.id)
        .maybeSingle()
        .then((r) => r.data)
    : null;

  const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "").toLowerCase();

  const userEmail = (user?.email || "").toLowerCase();
  const emailMatch = userEmail === allowedAdminEmail;
  const isAdmin = profile?.is_admin || false;
  const canAccessAdmin = emailMatch;

  return (
    <div className="p-8">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">🔍 Debug Admin Access</h1>

        <div className="space-y-2 bg-muted/95 p-4 rounded">
          <p>
            <strong>Logueado:</strong>{" "}
            <span className={user ? "text-success-foreground" : "text-destructive-foreground"}>
              {user ? "✓ SÍ" : "✗ NO"}
            </span>
          </p>
          <p>
            <strong>Email del usuario:</strong> <code>{userEmail}</code>
          </p>
          <p>
            <strong>Email permitido (env):</strong> <code>{allowedAdminEmail}</code>
          </p>
          <p>
            <strong>¿Emailes coinciden?:</strong>{" "}
            <span className={emailMatch ? "text-success-foreground font-bold" : "text-destructive-foreground font-bold"}>
              {emailMatch ? "✓ SÍ" : "✗ NO"}
            </span>
          </p>
        </div>

        <div className="space-y-2 bg-info/95 p-4 rounded">
          <p>
            <strong>is_admin en DB:</strong>{" "}
            <span className={isAdmin ? "text-success-foreground font-bold" : "text-destructive-foreground font-bold"}>
              {isAdmin ? "✓ TRUE" : "✗ FALSE"}
            </span>
          </p>
          <p>
            <strong>Perfil trovato:</strong> {profile ? "✓ SÍ" : "✗ NO"}
          </p>
          {profile && (
            <p>
              <strong>Nombre en DB:</strong> {profile.nombre}
            </p>
          )}
        </div>

        <div className="space-y-2 bg-warning/95 p-4 rounded">
          <p className="text-lg font-bold">
            <strong>¿Puede acceder a /admin?:</strong>{" "}
            <span className={canAccessAdmin ? "text-success-foreground" : "text-destructive-foreground"}>
              {canAccessAdmin ? "✓ SÍ" : "✗ NO"}
            </span>
          </p>
          {!emailMatch && <p className="text-destructive-foreground">❌ Email no coincide</p>}
          {!isAdmin && <p className="text-warning-foreground">⚠ is_admin no está marcado en DB (ya no bloquea el acceso)</p>}
        </div>

        {user && (
          <div className="text-xs bg-card p-3 rounded mt-4">
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
            <p>
              <strong>Última autenticación:</strong>{" "}
              {new Date(user.updated_at || "").toLocaleString()}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
