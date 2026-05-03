import Image from "next/image";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Link from "next/link";
import { MessageCircleMore, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminChatLivePanel } from "../../../components/admin/admin-chat-live-panel";
import { requireAdminUser } from "@/lib/admin";

type PageProps = {
  searchParams?: {
    session?: string;
  };
};

type ChatSessionRow = {
  id: string;
  client_id: string;
  status: string;
  lead_stage: string;
  joined_by_admin_id: string | null;
  joined_at: string | null;
  source: string;
  last_message_at: string;
  created_at: string;
};

type ChatMessageRow = {
  id: string;
  session_id?: string;
  sender: string;
  content: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
  telefono: string | null;
  avatar_url: string | null;
  email?: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return "CL";
  return words.map((word) => word[0]?.toUpperCase() || "").join("");
}

function getStatePresentation(session: Pick<ChatSessionRow, "status" | "lead_stage" | "joined_by_admin_id">) {
  const status = String(session.status || "").trim().toLowerCase();
  const stage = String(session.lead_stage || "").trim().toLowerCase();

  if (session.joined_by_admin_id) {
    return {
      label: "Asesor se unió",
      className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      alert: false,
    };
  }

  if (stage === "en_seguimiento") {
    return {
      label: "En seguimiento",
      className: "bg-amber-100 text-amber-700 border border-amber-200",
      alert: false,
    };
  }

  if (stage === "contactado" || status === "active" || status === "contactado") {
    return {
      label: "Asesor contactó",
      className: "bg-sky-100 text-sky-700 border border-sky-200",
      alert: false,
    };
  }

  if (status === "lead") {
    return {
      label: "Lead nuevo",
      className: "bg-rose-100 text-rose-700 border border-rose-200",
      alert: true,
    };
  }

  return {
    label: "Cliente espera contacto",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
    alert: false,
  };
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function buildContactLine(profile: ProfileRow | undefined) {
  const phone = String(profile?.telefono || "").trim();
  const email = String(profile?.email || "").trim();

  if (phone && email) return `${phone} | ${email}`;
  if (phone) return phone;
  if (email) return email;
  return "Sin número / correo";
}

function buildSessionContextText(session: ChatSessionRow, advisorName: string | null) {
  const status = String(session.status || "").trim().toLowerCase();
  const stage = String(session.lead_stage || "").trim().toLowerCase();

  if (session.joined_by_admin_id) {
    return advisorName ? `Asesor se unió: ${advisorName}` : "Asesor se unió";
  }

  if (stage === "en_seguimiento") {
    return "Cliente en seguimiento";
  }

  if (stage === "contactado" || status === "active" || status === "contactado") {
    return advisorName ? `Asesor contactó: ${advisorName}` : "Asesor contactó";
  }

  if (status === "lead") {
    return "Lead nuevo sin revisar";
  }

  return "Cliente espera contacto";
}

export default async function AdminChatsPage({ searchParams }: PageProps) {
  const { user } = await requireAdminUser("chat.manage");

  const service = getServiceClient();

  if (!service) {
    return (
      <main className="space-y-5 pb-8">
        <Card className="glass-card">
          <CardContent className="p-5 text-sm text-muted-foreground">
            Configura SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY para usar el módulo de chats.
          </CardContent>
        </Card>
      </main>
    );
  }

  const { data: sessionsData } = await service
    .from("chat_sessions")
    .select("id,client_id,status,lead_stage,joined_by_admin_id,joined_at,source,last_message_at,created_at")
    .order("last_message_at", { ascending: false })
    .limit(80);

  const sessions = (sessionsData || []) as ChatSessionRow[];
  const selectedSessionId = String(searchParams?.session || sessions[0]?.id || "");

  const clientIds = Array.from(new Set(sessions.map((item) => item.client_id))).filter(Boolean);
  const advisorIds = Array.from(new Set(sessions.map((item) => String(item.joined_by_admin_id || "").trim()).filter(Boolean)));

  const [profileQuery, advisorQuery, messagesQuery] = await Promise.all([
    (async () => {
      if (!clientIds.length) return [] as ProfileRow[];

      const withEmail = await service
        .from("profiles")
        .select("id,nombre,telefono,avatar_url,email")
        .in("id", clientIds);

      if (withEmail.error) {
        const fallback = await service
          .from("profiles")
          .select("id,nombre,telefono,avatar_url")
          .in("id", clientIds);

        return (fallback.data || []) as ProfileRow[];
      }

      return (withEmail.data || []) as ProfileRow[];
    })(),
    advisorIds.length
      ? service.from("profiles").select("id,nombre").in("id", advisorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; nombre: string | null }> }),
    selectedSessionId
      ? service
          .from("chat_messages")
          .select("id,sender,content,created_at")
          .eq("session_id", selectedSessionId)
          .order("created_at", { ascending: true })
          .limit(200)
      : Promise.resolve({ data: [] as ChatMessageRow[] }),
  ]);

  const profilesById = new Map((profileQuery || []).map((item) => [item.id, item]));
  const advisorNameById = new Map(((advisorQuery.data || []) as Array<{ id: string; nombre: string | null }>).map((item) => [item.id, String(item.nombre || "").trim()]));

  const messagesData = messagesQuery.data as ChatMessageRow[] | null;

  const messages = (messagesData || []) as ChatMessageRow[];
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) || null;

  return (
    <main className="space-y-5 pb-8">
      <header className="glass-card rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">CRM de asistente</p>
        <h1 className="font-[var(--font-display)] text-3xl">Chats activos y leads</h1>
      </header>

      <section className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Conversaciones registradas</CardTitle>
          </CardHeader>
          <CardContent className="grid max-h-[70vh] gap-2 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay chats registrados.</p>
            ) : null}

            {sessions.map((session) => {
              const profile = profilesById.get(session.client_id);
              const isSelected = selectedSessionId === session.id;
              const displayName = profile?.nombre?.trim() || "Cliente";
              const avatarUrl = String(profile?.avatar_url || "").trim();
              const hasAvatar = avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://") || avatarUrl.startsWith("/");
              const state = getStatePresentation(session);
              const contactText = buildContactLine(profile);
              const advisorName = session.joined_by_admin_id ? advisorNameById.get(session.joined_by_admin_id) || null : null;
              const contextText = buildSessionContextText(session, advisorName);

              return (
                <Link
                  key={session.id}
                  href={`/admin/chats?session=${session.id}`}
                  className={`rounded-2xl border p-3 text-sm transition ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-white/40 bg-white/50 hover:border-primary/40 hover:bg-white/70"
                  }`}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e3d7cd] bg-[#f7f1ec] text-[#7d5a44]">
                      {hasAvatar ? (
                        <Image src={avatarUrl} alt={displayName} width={44} height={44} unoptimized className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex items-center justify-center">
                          {displayName === "Cliente" ? <UserRound className="size-5" /> : <span className="text-xs font-semibold">{getInitials(displayName)}</span>}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 font-semibold text-foreground">{displayName}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${state.className}`}>
                          {state.alert ? <span className="inline-block size-1.5 rounded-full bg-current" /> : null}
                          {state.label}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {contactText}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/60 pt-2 text-[11px] text-muted-foreground">
                    <span className="line-clamp-1">{contextText}</span>
                    <span>{formatDate(session.last_message_at)}</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircleMore className="size-4 text-primary" />
              Detalle de conversación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedSessionId ? (
              <p className="text-sm text-muted-foreground">Selecciona una conversación para ver el detalle.</p>
            ) : null}

            {selectedSessionId ? (
              <>
                {selectedSession ? (
                  <div className="rounded-2xl border border-white/40 bg-white/50 p-3 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>Estado: <strong className="text-foreground">{selectedSession.status}</strong></span>
                      <span>Etapa: <strong className="text-foreground">{selectedSession.lead_stage}</strong></span>
                    </div>
                  </div>
                ) : null}

                <AdminChatLivePanel
                  sessionId={selectedSessionId}
                  initialMessages={messages}
                  initiallyJoined={Boolean(selectedSession?.joined_by_admin_id && selectedSession.joined_by_admin_id === user.id)}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
