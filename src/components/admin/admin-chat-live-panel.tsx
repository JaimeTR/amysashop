"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircleMore, Send, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  id: string;
  sender: string;
  content: string;
  created_at: string;
};

type Props = {
  sessionId: string;
  initialMessages: ChatMessage[];
  initiallyJoined: boolean;
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AdminChatLivePanel({ sessionId, initialMessages, initiallyJoined }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [joined, setJoined] = useState(initiallyJoined);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("Asesor");
  const [adminAvatarUrl, setAdminAvatarUrl] = useState("");
  const [clientAvatarUrl, setClientAvatarUrl] = useState("");
  const [advisorLabel, setAdvisorLabel] = useState<"asesor" | "asesora">("asesor");
  const [errorMsg, setErrorMsg] = useState("");
  const [showSwitchChatModal, setShowSwitchChatModal] = useState(false);
  const [pendingPreviousJoinedIds, setPendingPreviousJoinedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const refreshJoinStateForCurrentUser = useCallback(async (userId: string) => {
    if (!sessionId || !userId) {
      setJoined(false);
      return;
    }

    const { data } = await supabase
      .from("chat_sessions")
      .select("joined_by_admin_id")
      .eq("id", sessionId)
      .maybeSingle();

    const joinedBy = String((data as { joined_by_admin_id?: string | null } | null)?.joined_by_admin_id || "").trim();
    setJoined(Boolean(joinedBy) && joinedBy === userId);
  }, [sessionId, supabase]);

  function resolveAdvisorLabel(value: unknown) {
    const normalized = String(value || "").trim().toLowerCase();

    if (["f", "female", "femenino", "femenina", "mujer", "woman"].includes(normalized)) {
      return "asesora" as const;
    }

    if (["m", "male", "masculino", "hombre", "man"].includes(normalized)) {
      return "asesor" as const;
    }

    return "asesor" as const;
  }

  const refreshMessages = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id,sender,content,created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error || !data) {
      return;
    }

    const parsed = data as ChatMessage[];

    setMessages((prev) => {
      if (prev.length === parsed.length && prev.at(-1)?.id === parsed.at(-1)?.id) {
        return prev;
      }
      return parsed;
    });
  }, [sessionId, supabase]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!sessionId) {
      setJoined(false);
      setShowSwitchChatModal(false);
      setPendingPreviousJoinedIds([]);
      return;
    }

    if (!currentUserId) {
      setJoined(Boolean(initiallyJoined));
      return;
    }

    refreshJoinStateForCurrentUser(currentUserId);
  }, [sessionId, currentUserId, initiallyJoined, refreshJoinStateForCurrentUser]);

  useEffect(() => {
    let active = true;

    async function resolveAuthUserSafe() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        return user || null;
      } catch (error) {
        const message = String((error as { message?: string } | null)?.message || "");
        const isLockContention = message.includes("was released because another request stole it");

        if (!isLockContention) {
          return null;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        return session?.user || null;
      }
    }

    async function loadCurrentUser() {
      const user = await resolveAuthUserSafe();

      if (!active) return;

      setCurrentUserId(user?.id || "");
      const userName = String(user?.user_metadata?.nombre || "").trim();
      if (userName) {
        setCurrentUserName(userName);
      }

      const userGender =
        user?.user_metadata?.gender || user?.user_metadata?.genero || user?.user_metadata?.sexo || null;
      setAdvisorLabel(resolveAdvisorLabel(userGender));

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre,gender,avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        const profileName = String((profile as { nombre?: string | null } | null)?.nombre || "").trim();
        if (profileName) {
          setCurrentUserName(profileName);
        }

        const profileGender = (profile as { gender?: string | null } | null)?.gender || null;
        if (profileGender) {
          setAdvisorLabel(resolveAdvisorLabel(profileGender));
        }

        setAdminAvatarUrl(String((profile as { avatar_url?: string | null } | null)?.avatar_url || "").trim());
      }

      if (user?.id) {
        await refreshJoinStateForCurrentUser(user.id);
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, [supabase, refreshJoinStateForCurrentUser]);

  useEffect(() => {
    let active = true;

    async function loadClientAvatarForSession() {
      if (!sessionId) {
        setClientAvatarUrl("");
        return;
      }

      const { data: sessionRow } = await supabase
        .from("chat_sessions")
        .select("client_id")
        .eq("id", sessionId)
        .maybeSingle();

      if (!active) return;

      const clientId = String((sessionRow as { client_id?: string | null } | null)?.client_id || "").trim();
      if (!clientId) {
        setClientAvatarUrl("");
        return;
      }

      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", clientId)
        .maybeSingle();

      if (!active) return;

      setClientAvatarUrl(String((clientProfile as { avatar_url?: string | null } | null)?.avatar_url || "").trim());
    }

    loadClientAvatarForSession();

    return () => {
      active = false;
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;
    target.scrollTop = target.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`admin-chat-live-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((item) => item.id === row.id)) {
              return prev;
            }
            return [...prev, row];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as { joined_by_admin_id?: string | null };
          const joinedBy = String(row.joined_by_admin_id || "").trim();
          setJoined(Boolean(currentUserId) && joinedBy === currentUserId);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          refreshMessages();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase, currentUserId, refreshMessages]);

  useEffect(() => {
    if (!sessionId) return;

    refreshMessages();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshMessages();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionId, refreshMessages]);

  async function handleJoin() {
    if (!sessionId || !currentUserId) return;

    setLoadingJoin(true);
    setErrorMsg("");

    const nowIso = new Date().toISOString();

    const { data: activeJoins } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("joined_by_admin_id", currentUserId)
      .neq("id", sessionId)
      .limit(20);

    const previousJoinedIds = (activeJoins || [])
      .map((row) => String((row as { id?: string }).id || "").trim())
      .filter(Boolean);

    if (previousJoinedIds.length > 0) {
      setPendingPreviousJoinedIds(previousJoinedIds);
      setShowSwitchChatModal(true);
      setLoadingJoin(false);
      return;
    }

    await completeJoin([]);
  }

  async function completeJoin(previousJoinedIds: string[]) {
    if (!sessionId || !currentUserId) return;

    setLoadingJoin(true);
    setErrorMsg("");

    const nowIso = new Date().toISOString();

    if (previousJoinedIds.length > 0) {
      await supabase
        .from("chat_sessions")
        .update({
          joined_by_admin_id: null,
          joined_at: null,
          lead_stage: "contactado",
          status: "active",
          updated_at: nowIso,
        })
        .in("id", previousJoinedIds);

      const autoLeaveMessage = `${currentUserName} salio del chat.`;
      const leaveRows = previousJoinedIds.map((previousSessionId) => ({
        session_id: previousSessionId,
        sender: "system",
        content: autoLeaveMessage,
      }));

      const { error: autoLeaveMessageError } = await supabase
        .from("chat_messages")
        .insert(leaveRows);

      if (autoLeaveMessageError) {
        setErrorMsg(autoLeaveMessageError.message);
      }
    }

    const { error } = await supabase
      .from("chat_sessions")
      .update({
        status: "lead",
        lead_stage: "en_seguimiento",
        joined_by_admin_id: currentUserId,
        joined_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", sessionId);

    if (error) {
      setErrorMsg(error.message);
      setLoadingJoin(false);
      return;
    }

    const statusMessage = `${currentUserName} se unio al chat.`;
    const joinMessage = `Hola, soy ${currentUserName} tu ${advisorLabel} de AMYSA. Ya me uni a esta conversacion para ayudarte en tiempo real.`;

    const { error: joinMsgError } = await supabase.from("chat_messages").insert([
      {
        session_id: sessionId,
        sender: "system",
        content: statusMessage,
      },
      {
        session_id: sessionId,
        sender: "admin",
        content: joinMessage,
      },
    ]);

    if (joinMsgError) {
      setErrorMsg(joinMsgError.message);
    }

    setJoined(true);
    setShowSwitchChatModal(false);
    setPendingPreviousJoinedIds([]);
    setLoadingJoin(false);
  }

  async function handleConfirmSwitchChat() {
    await completeJoin(pendingPreviousJoinedIds);
  }

  function handleCancelSwitchChat() {
    setShowSwitchChatModal(false);
    setPendingPreviousJoinedIds([]);
  }

  async function handleLeave() {
    if (!sessionId) return;

    setLoadingJoin(true);
    setErrorMsg("");

    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from("chat_sessions")
      .update({
        joined_by_admin_id: null,
        joined_at: null,
        lead_stage: "contactado",
        status: "active",
        updated_at: nowIso,
      })
      .eq("id", sessionId);

    if (error) {
      setErrorMsg(error.message);
      setLoadingJoin(false);
      return;
    }

    const leaveMessage = `${currentUserName} salio del chat.`;

    const { error: leaveMsgError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender: "system",
      content: leaveMessage,
    });

    if (leaveMsgError) {
      setErrorMsg(leaveMsgError.message);
    }

    setJoined(false);
    setLoadingJoin(false);
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = text.trim();
    if (!content || !sessionId) return;

    setSending(true);
    setErrorMsg("");

    const nowIso = new Date().toISOString();

    const { data: insertedMessage, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        sender: "admin",
        content,
      })
      .select("id,sender,content,created_at")
      .single();

    if (insertError || !insertedMessage) {
      setErrorMsg(insertError?.message || "No se pudo enviar el mensaje");
      setSending(false);
      return;
    }

    setMessages((prev) => {
      if (prev.some((item) => item.id === insertedMessage.id)) {
        return prev;
      }

      return [
        ...prev,
        {
          id: insertedMessage.id,
          sender: insertedMessage.sender,
          content: insertedMessage.content,
          created_at: insertedMessage.created_at,
        },
      ];
    });

    await supabase
      .from("chat_sessions")
      .update({
        status: "lead",
        lead_stage: "en_seguimiento",
        joined_by_admin_id: currentUserId || null,
        joined_at: nowIso,
        last_message_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", sessionId);

    setText("");
    setJoined(true);
    setSending(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageCircleMore className="size-4 text-primary" />
          <p className="text-sm font-semibold">Detalle en tiempo real</p>
        </div>

        {joined ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase">
              Asesor unido
            </Badge>
            <Button type="button" size="sm" variant="outline" onClick={handleLeave} disabled={loadingJoin}>
              {loadingJoin ? "Saliendo..." : "Salir de conversación"}
            </Button>
          </div>
        ) : (
          <Button type="button" size="sm" onClick={handleJoin} disabled={loadingJoin || !currentUserId}>
            {loadingJoin ? "Uniendo..." : "Unirme como asesor"}
          </Button>
        )}
      </div>

      <div ref={containerRef} className="max-h-[58vh] space-y-2 overflow-y-auto rounded-2xl border border-white/30 bg-white/40 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay mensajes en esta conversación.</p>
        ) : null}

        {messages.map((message) => {
          const isClient = message.sender === "client";
          const isAssistant = message.sender === "assistant";
          const isAdmin = message.sender === "admin";
          const isSystem = message.sender === "system";

          return (
            <article key={message.id} className={`flex items-start gap-2 ${isSystem ? "justify-center" : ""}`}>
              {isSystem ? (
                <div className="rounded-full border border-slate-300/70 bg-slate-100/90 px-3 py-1 text-[11px] font-semibold text-slate-700">
                  {message.content}
                </div>
              ) : null}

              {!isSystem ? (
                <>
                  <div className="mt-1">
                    {isClient ? (
                      clientAvatarUrl ? (
                        <Image
                          src={clientAvatarUrl}
                          alt="Cliente"
                          width={28}
                          height={28}
                          unoptimized
                          className="size-7 rounded-full border border-primary/20 object-cover"
                        />
                      ) : (
                        <div className="grid size-7 place-content-center rounded-full border border-primary/20 bg-primary/10">
                          <UserRound className="size-4 text-primary" />
                        </div>
                      )
                    ) : null}

                    {isAdmin ? (
                      adminAvatarUrl ? (
                        <Image
                          src={adminAvatarUrl}
                          alt="Asesor"
                          width={28}
                          height={28}
                          unoptimized
                          className="size-7 rounded-full border border-emerald-300/70 object-cover"
                        />
                      ) : (
                        <div className="grid size-7 place-content-center rounded-full border border-emerald-300/70 bg-emerald-50">
                          <UserRound className="size-4 text-emerald-700" />
                        </div>
                      )
                    ) : null}

                    {isAssistant ? (
                      <div className="grid size-7 place-content-center rounded-full border border-white/40 bg-white/80">
                        <Bot className="size-4 text-primary" />
                      </div>
                    ) : null}
                  </div>

                  <div
                    className={`min-w-0 flex-1 rounded-2xl border px-3 py-2 text-sm ${
                      isClient
                        ? "border-primary/30 bg-primary/10"
                        : isAssistant
                          ? "border-white/40 bg-white/70"
                          : isAdmin
                            ? "border-emerald-300/70 bg-emerald-50/90"
                            : "border-white/30 bg-white/50"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <span>{message.sender}</span>
                      <span>{formatDate(message.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-foreground">{message.content}</p>
                  </div>
                </>
              ) : null}
            </article>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={joined ? "Escribe como asesor..." : "Únete como asesor para responder"}
          className="h-10 flex-1 rounded-xl border border-input bg-white/90 px-3 text-sm outline-none focus:border-primary/40"
          disabled={sending || !joined}
        />
        <Button type="submit" size="icon" disabled={sending || !joined || !text.trim()}>
          <Send className="size-4" />
        </Button>
      </form>

      {errorMsg ? <p className="text-xs text-rose-700">{errorMsg}</p> : null}

      {mounted && showSwitchChatModal
        ? createPortal(
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4">
              <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-foreground">Cambiar de conversación</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ya estás unida a otra conversación. ¿Quieres cambiar de chat y unirte a este usuario?
                  Se dejará la conversación anterior.
                </p>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelSwitchChat}
                    disabled={loadingJoin}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmSwitchChat}
                    disabled={loadingJoin}
                  >
                    {loadingJoin ? "Cambiando..." : "Sí, cambiar y unirme"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
