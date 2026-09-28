import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminPageNotifications } from "@/components/feedback/admin-page-notifications";
import { requireAdminUser } from "@/lib/admin";
import { sendComplaintResponseEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
export const metadata = { title: "Libro de Reclamaciones - Admin" };

type Complaint = {
  id: string;
  code: string;
  consumer_name: string;
  document_type: string;
  document_number: string;
  address: string;
  phone: string | null;
  email: string;
  is_minor: boolean;
  guardian_name: string | null;
  item_type: string;
  item_description: string;
  amount: number | null;
  order_reference: string | null;
  complaint_type: string;
  detail: string;
  consumer_request: string;
  status: "pending" | "answered";
  provider_response: string | null;
  responded_at: string | null;
  created_at: string;
};

// Plazo legal: 15 días hábiles (lunes a viernes) desde el registro.
function businessDaysLeft(createdAt: string) {
  let days = 0;
  const date = new Date(createdAt);
  const deadline = new Date(date);
  while (days < 15) {
    deadline.setDate(deadline.getDate() + 1);
    const day = deadline.getDay();
    if (day !== 0 && day !== 6) days += 1;
  }
  return { deadline, overdue: Date.now() > deadline.getTime() };
}

async function respondComplaintAction(formData: FormData) {
  "use server";
  await requireAdminUser("clients.manage");
  const db = createServiceRoleClient();
  if (!db) redirect("/admin/reclamaciones?error=Falta+SUPABASE_SECRET_KEY");

  const id = String(formData.get("id") || "");
  const response = String(formData.get("response") || "").trim();
  if (!id || response.length < 5) redirect("/admin/reclamaciones?error=Escribe+la+respuesta");

  const { data, error } = await db
    .from("complaints")
    .update({ status: "answered", provider_response: response, responded_at: new Date().toISOString() })
    .eq("id", id)
    .select("code,email,consumer_name")
    .single();
  if (error || !data) redirect(`/admin/reclamaciones?error=${encodeURIComponent(error?.message || "No se pudo guardar")}`);

  const email = await sendComplaintResponseEmail({ to: data.email, code: data.code, consumerName: data.consumer_name, response });
  revalidatePath("/admin/reclamaciones");
  redirect(
    email.ok
      ? "/admin/reclamaciones?ok=Respuesta+enviada+al+consumidor"
      : `/admin/reclamaciones?error=${encodeURIComponent(`Respuesta guardada, pero el correo falló (${email.error}). Envíala por otro medio.`)}`
  );
}

export default async function AdminReclamacionesPage({ searchParams }: { searchParams?: { ok?: string; error?: string } }) {
  await requireAdminUser("clients.manage");
  const db = createServiceRoleClient();
  const { data, error } = db
    ? await db.from("complaints").select("*").order("created_at", { ascending: false }).limit(200)
    : { data: null, error: { message: "Falta SUPABASE_SECRET_KEY" } };
  const complaints = (data || []) as Complaint[];
  const pending = complaints.filter((item) => item.status === "pending").length;

  return (
    <main className="space-y-5 pb-8">
      <AdminPageNotifications ok={searchParams?.ok} error={searchParams?.error} />
      <header className="glass-card rounded-3xl p-5">
        <h1 className="font-[var(--font-display)] text-3xl">Libro de Reclamaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pending} pendiente(s). Plazo legal de respuesta: 15 días hábiles. Conserva los registros al menos 2 años.
        </p>
        {error ? <p className="mt-2 text-sm text-destructive-strong">No se pudo cargar: {error.message}. ¿Ejecutaste la migración 20260929_libro_reclamaciones.sql?</p> : null}
      </header>

      {complaints.length === 0 && !error ? (
        <p className="glass-card rounded-3xl p-8 text-center text-sm text-muted-foreground">No hay reclamos registrados.</p>
      ) : null}

      <ul className="space-y-4">
        {complaints.map((item) => {
          const { deadline, overdue } = businessDaysLeft(item.created_at);
          return (
            <li key={item.id} className="glass-card space-y-3 rounded-3xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold">{item.code}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold capitalize text-primary">{item.complaint_type}</span>
                {item.status === "answered" ? (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success-strong">Respondido</span>
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${overdue ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning-strong"}`}>
                    {overdue ? "Fuera de plazo" : `Responder antes del ${deadline.toLocaleDateString("es-PE")}`}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("es-PE", { timeZone: "America/Lima" })}</span>
              </div>
              <div className="grid gap-1 text-sm sm:grid-cols-2">
                <p><strong>{item.consumer_name}</strong> · {item.document_type} {item.document_number}</p>
                <p className="text-muted-foreground">{item.email}{item.phone ? ` · ${item.phone}` : ""}</p>
                <p className="text-muted-foreground sm:col-span-2">{item.address}</p>
                {item.is_minor ? <p className="text-muted-foreground sm:col-span-2">Menor de edad · Apoderado: {item.guardian_name}</p> : null}
                <p className="sm:col-span-2">
                  <strong className="capitalize">{item.item_type}:</strong> {item.item_description}
                  {item.amount != null ? ` · S/ ${Number(item.amount).toFixed(2)}` : ""}
                  {item.order_reference ? ` · Pedido ${item.order_reference}` : ""}
                </p>
              </div>
              <div className="space-y-2 rounded-2xl bg-white/60 p-3 text-sm">
                <p className="whitespace-pre-wrap"><strong>Detalle:</strong> {item.detail}</p>
                <p className="whitespace-pre-wrap"><strong>Pedido:</strong> {item.consumer_request}</p>
              </div>
              {item.status === "answered" ? (
                <p className="whitespace-pre-wrap rounded-2xl bg-success/10 p-3 text-sm">
                  <strong>Respuesta ({item.responded_at ? new Date(item.responded_at).toLocaleDateString("es-PE") : ""}):</strong> {item.provider_response}
                </p>
              ) : (
                <form action={respondComplaintAction} className="space-y-2">
                  <input type="hidden" name="id" value={item.id} />
                  <textarea name="response" required minLength={5} placeholder="Respuesta y acciones adoptadas por el proveedor" className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                  <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                    Responder y enviar por correo
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
