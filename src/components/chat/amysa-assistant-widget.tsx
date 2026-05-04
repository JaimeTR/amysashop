"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Send, Sparkles, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  userId: string;
  userName?: string;
};

type UiMessage = {
  id: string;
  sender: "client" | "assistant" | "admin" | "system";
  content: string;
  recommendations?: Recommendation[];
};

type Recommendation = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localFallback(userMessage: string) {
  const query = userMessage.toLowerCase();

  if (query.includes("hola") || query.includes("buenas")) {
    return "Hola, soy AMYSA AI. Para ayudarte mejor, dime tu nombre y un número de celular o correo, y luego qué deseas comprar.";
  }

  if (query.includes("precio") || query.includes("barato") || query.includes("econom")) {
    return "Puedo ayudarte a buscar opciones por rango de precio. Dime tu presupuesto aproximado en soles y te recomiendo opciones.";
  }

  return "En este momento estoy en modo básico. Cuéntame qué tipo de producto quieres y te guío para encontrarlo rápido en la tienda.";
}

function TypingText({ text, animate }: { text: string; animate: boolean }) {
  const [visible, setVisible] = useState(animate ? "" : text);

  useEffect(() => {
    if (!animate) {
      setVisible(text);
      return;
    }

    setVisible("");
    let index = 0;
    const timerId = window.setInterval(() => {
      index += 1;
      setVisible(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timerId);
      }
    }, 14);

    return () => {
      window.clearInterval(timerId);
    };
  }, [text, animate]);

  return <span>{visible}</span>;
}

export function AmysaAssistantWidget({ userId, userName }: Props) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpNudge, setShowHelpNudge] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [advisorInControl, setAdvisorInControl] = useState(false);
  const [clientAvatarUrl, setClientAvatarUrl] = useState("");
  const [lastAnimatedMessageId, setLastAnimatedMessageId] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: makeId(),
      sender: "assistant",
      content: `Hola${userName ? ` ${userName}` : ""}, soy AMYSA AI. Para ayudarte mejor, dime tu nombre y un número de celular o correo, y luego qué deseas comprar.`,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const browserNudgeSentRef = useRef(false);
  const sendLockRef = useRef(false);
  const storageKey = `amysa-ai-session:${userId}`;

  const refreshSessionMessages = useCallback(async (targetSessionId: string) => {
    if (!targetSessionId) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("id,sender,content,metadata")
      .eq("session_id", targetSessionId)
      .order("created_at", { ascending: true })
      .limit(120);

    if (!data || data.length === 0) {
      return;
    }

    const parsed = data
      .filter((item) => item.sender === "client" || item.sender === "assistant" || item.sender === "admin" || item.sender === "system")
      .map((item) => ({
        id: String(item.id || makeId()),
        sender: item.sender as "client" | "assistant" | "admin" | "system",
        content: String(item.content || ""),
        recommendations: Array.isArray((item as { metadata?: { recommendations?: unknown[] } }).metadata?.recommendations)
          ? ((item as { metadata?: { recommendations?: Recommendation[] } }).metadata?.recommendations || [])
          : undefined,
      }));

    setMessages(parsed);

    if (parsed.some((item) => item.sender === "admin")) {
      setAdvisorInControl(true);
    } else {
      setAdvisorInControl(false);
    }
  }, [supabase]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    setSessionId(saved);

    refreshSessionMessages(saved);
  }, [storageKey, refreshSessionMessages]);

  useEffect(() => {
    let active = true;

    async function loadClientAvatar() {
      if (!userId) {
        if (active) setClientAvatarUrl("");
        return;
      }

      const { data } = await supabase.from("profiles").select("img_avatar,avatar_url").eq("id", userId).maybeSingle();
      if (!active) return;

      setClientAvatarUrl(String((data as { img_avatar?: string | null; avatar_url?: string | null } | null)?.img_avatar || (data as { avatar_url?: string | null } | null)?.avatar_url || "").trim());
    }

    loadClientAvatar();

    return () => {
      active = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    const target = scrollRef.current;
    if (!target) return;
    target.scrollTop = target.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`client-chat-live-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender: string;
            content: string;
            metadata?: { recommendations?: Recommendation[] };
          };

          if (row.sender !== "admin" && row.sender !== "system") {
            return;
          }

          setMessages((prev) => {
            if (prev.some((item) => item.id === row.id)) {
              return prev;
            }

            return [
              ...prev,
              {
                id: row.id,
                sender: row.sender as "admin" | "system",
                content: row.content,
                recommendations: Array.isArray(row.metadata?.recommendations) ? row.metadata?.recommendations : undefined,
              },
            ];
          });

          if (row.sender === "admin") {
            setLastAnimatedMessageId(row.id);
            setAdvisorInControl(true);
          }
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
          const row = payload.new as {
            joined_by_admin_id?: string | null;
            status?: string;
            lead_stage?: string;
          };

          const joined = Boolean(row.joined_by_admin_id);
          setAdvisorInControl(joined);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  useEffect(() => {
    if (!sessionId || !advisorInControl) return;

    const pollId = window.setInterval(() => {
      refreshSessionMessages(sessionId);
    }, 5000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [sessionId, advisorInControl, refreshSessionMessages]);

  useEffect(() => {
    setShowHelpNudge(false);

    if (pathname !== "/" || isOpen) {
      return;
    }

    let stopped = false;
    let loopTimerId = 0;

    function notifyIfBackground() {
      if (browserNudgeSentRef.current) return;
      if (typeof window === "undefined") return;
      if (!("Notification" in window)) return;
      if (document.visibilityState === "visible") return;
      if (Notification.permission !== "granted") return;

      browserNudgeSentRef.current = true;
      new Notification("AMYSA AI", {
        body: "Hola, ¿necesitas ayuda para tu compra?",
      });
    }

    function scheduleNudge(delayMs: number) {
      loopTimerId = window.setTimeout(() => {
        if (stopped) return;

        setShowHelpNudge(true);
        notifyIfBackground();

        window.setTimeout(() => {
          if (!stopped) {
            setShowHelpNudge(false);
          }
        }, 9000);

        scheduleNudge(30000);
      }, delayMs);
    }

    scheduleNudge(10000);

    return () => {
      stopped = true;
      window.clearTimeout(loopTimerId);
    };
  }, [pathname, isOpen]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading || sendLockRef.current) return;

    sendLockRef.current = true;

    const outgoing: UiMessage = { id: makeId(), sender: "client", content: text };
    setMessages((prev) => [...prev, outgoing]);
    setInput("");
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo conectar con AMYSA AI");
      }

      const data = (await response.json()) as {
        sessionId?: string;
        reply?: string;
        recommendations?: Recommendation[];
        pausedByAdvisor?: boolean;
        advisorJoined?: boolean;
      };

      const nextSession = String(data.sessionId || "").trim();
      if (nextSession) {
        setSessionId(nextSession);
        localStorage.setItem(storageKey, nextSession);
      }

      if (data.pausedByAdvisor || data.advisorJoined) {
        setAdvisorInControl(true);
        if (nextSession) {
          await refreshSessionMessages(nextSession);
        }
        setIsLoading(false);
        return;
      }

      setAdvisorInControl(false);

      const messageId = makeId();
      setLastAnimatedMessageId(messageId);

      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          sender: "assistant",
          content: String(data.reply || "").trim() || localFallback(text),
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : undefined,
        },
      ]);
    } catch {
      const messageId = makeId();
      setLastAnimatedMessageId(messageId);
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          sender: "assistant",
          content: localFallback(text),
        },
      ]);
    } finally {
      setIsLoading(false);
      sendLockRef.current = false;
    }
  }

  function handleOpenChat() {
    setIsOpen(true);
    setShowHelpNudge(false);
  }

  return (
    <div className="fixed bottom-20 right-4 z-[120] md:bottom-4 md:right-6">
      {isOpen ? (
        <div className="glass-card w-[min(92vw,360px)] overflow-hidden rounded-3xl border border-primary/20 shadow-2xl">
          <div className="flex items-center justify-between bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-sm font-semibold">AMYSA AI</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
              <X className="size-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="max-h-[52vh] space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "system" ? (
                  <div className="mx-auto rounded-full border border-slate-300/70 bg-slate-100/90 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    {msg.content}
                  </div>
                ) : null}

                {msg.sender !== "system" && (msg.sender === "assistant" || msg.sender === "admin") ? (
                  <div className="mr-2 mt-1">
                    {msg.sender === "admin" ? (
                      <div className="grid size-7 place-content-center rounded-full border border-emerald-300/70 bg-emerald-50">
                        <UserRound className="size-4 text-emerald-700" />
                      </div>
                    ) : (
                      <Image
                        src="/logos/amysa-square-primary.png"
                        alt="AMYSA AI"
                        width={28}
                        height={28}
                        className="size-7 rounded-full border border-primary/20 bg-white"
                      />
                    )}
                  </div>
                ) : null}

                {msg.sender === "client" ? (
                  <div className="ml-2 mt-1 order-2">
                    {clientAvatarUrl ? (
                      <Image
                        src={clientAvatarUrl}
                        alt="Tu perfil"
                        width={28}
                        height={28}
                        unoptimized
                        className="size-7 rounded-full border border-primary/20 object-cover"
                      />
                    ) : (
                      <div className="grid size-7 place-content-center rounded-full border border-primary/20 bg-primary/10">
                        <UserRound className="size-4 text-primary" />
                      </div>
                    )}
                  </div>
                ) : null}

                {msg.sender !== "system" ? (
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    msg.sender === "client"
                      ? "order-1 bg-primary text-primary-foreground"
                      : msg.sender === "admin"
                        ? "border border-emerald-300/70 bg-emerald-50/95 text-foreground"
                        : "border border-white/40 bg-white/90 text-foreground"
                  }`}
                >
                  {msg.sender === "assistant" ? (
                    <TypingText text={msg.content} animate={msg.id === lastAnimatedMessageId} />
                  ) : (
                    msg.content
                  )}

                  {msg.sender === "assistant" && msg.recommendations && msg.recommendations.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {msg.recommendations.map((item) => (
                        <Link
                          key={item.id}
                          href={`/producto/${item.id}`}
                          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-white p-2 transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            unoptimized
                            className="size-14 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-xs font-semibold text-primary">{item.category}</p>
                            <p className="line-clamp-2 text-xs font-medium text-foreground">{item.name}</p>
                            <p className="text-xs font-semibold text-primary">S/ {Number(item.price).toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                ) : null}
              </div>
            ))}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/80 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="inline size-4 animate-spin" /> Pensando...
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 border-t border-white/30 p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu consulta..."
              className="h-10 flex-1 rounded-xl border border-input bg-white/80 px-3 text-sm outline-none focus:border-primary/40"
            />
            <Button type="button" size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {!isOpen ? (
        <div className="relative">
          {showHelpNudge ? (
            <button
              type="button"
              onClick={handleOpenChat}
              className="absolute -left-[172px] top-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg transition hover:bg-white"
              aria-label="Abrir asistencia AMYSA AI"
            >
              ¿Necesitas ayuda?
            </button>
          ) : null}

          <Button
            type="button"
            onClick={handleOpenChat}
            className="relative h-12 rounded-full border border-primary/30 bg-primary px-3 text-primary-foreground shadow-xl transition hover:scale-[1.04] hover:bg-primary"
            aria-label="Abrir AMYSA AI"
          >
            <span className="absolute -inset-1 rounded-full border border-primary/30 opacity-60 animate-ping" />
            <div className="relative z-10 flex items-center gap-2">
              <Image
                src="/logos/amysa-square-primary.png"
                alt="AMYSA AI"
                width={24}
                height={24}
                className="size-6 rounded-full bg-white p-0.5"
              />
              <span className="text-xs font-semibold tracking-wide">AMYSA AI</span>
            </div>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
