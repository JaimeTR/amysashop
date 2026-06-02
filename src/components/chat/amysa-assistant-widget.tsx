"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Send, Sparkles, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { getProductUrl } from "@/lib/product-url";
import { useCartStore } from "@/store/cart-store";
import { useNotify } from "@/components/feedback/notification-center";

type Props = {
  userId?: string;
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

  if (query.includes("hola") || query.includes("buenas") || query.includes("buen") || query.includes("hey")) {
    return "¡Hola! Soy AMYSA AI, tu asesora de ventas. ¿En qué puedo ayudarte hoy? Puedo recomendarte productos, mostrarte precios o ayudarte a encontrar lo que buscas.";
  }

  if (query.includes("precio") || query.includes("barato") || query.includes("econom")) {
    return "Claro, con gusto te ayudo. ¿Cuál es tu presupuesto aproximado? Así puedo mostrarte las mejores opciones disponibles.";
  }

  if (query.includes("gracias") || query.includes("graci")) {
    return "¡De nada! Si necesitas algo más, aquí estoy para ayudarte. Que tengas un lindo día 💛";
  }

  return "¡Hola! Soy AMYSA AI. ¿Qué producto, marca o categoría te gustaría ver? Estoy aquí para ayudarte a encontrar lo que necesitas.";
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
  const addToCartStore = useCartStore((state) => state.addItem);
  const notify = useNotify();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpNudge, setShowHelpNudge] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [advisorInControl, setAdvisorInControl] = useState(false);
  const [clientAvatarUrl, setClientAvatarUrl] = useState("");
  const [lastAnimatedMessageId, setLastAnimatedMessageId] = useState("");
  const [resolvedUserId, setResolvedUserId] = useState(userId || "");
  const [userDisplayName, setUserDisplayName] = useState(userName || "");
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: makeId(),
      sender: "assistant",
      content: `¡Hola${userName ? ` ${userName}` : ""}! Soy AMYSA AI, tu asesora de ventas. ¿En qué puedo ayudarte hoy?`,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const browserNudgeSentRef = useRef(false);
  const sendLockRef = useRef(false);
  const storageKey = `amysa-ai-session:${resolvedUserId || "guest"}`;

  useEffect(() => {
    if (userId) {
      setResolvedUserId(userId);
      return;
    }

    let active = true;

    async function syncSessionUser() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setResolvedUserId(data.session?.user.id || "");
    }

    syncSessionUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setResolvedUserId(session?.user.id || "");
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase, userId]);

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
    if (!resolvedUserId) return;

    let active = true;

    async function loadUserProfile() {
      const { data } = await supabase.from("profiles").select("nombre").eq("id", resolvedUserId).maybeSingle();
      if (!active) return;
      const name = data && typeof data === "object" && "nombre" in data ? String((data as { nombre?: string }).nombre || "").trim() : "";
      if (name && !userDisplayName) {
        setUserDisplayName(name);
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[0]?.sender === "assistant") {
            updated[0] = { ...updated[0], content: `¡Hola ${name}! Soy AMYSA AI, tu asesora de ventas. ¿En qué puedo ayudarte hoy?` };
          }
          return updated;
        });
      }
    }

    loadUserProfile();
    return () => { active = false; };
  }, [resolvedUserId, supabase, userDisplayName]);

  useEffect(() => {
    let active = true;

    async function loadClientAvatar() {
      if (!resolvedUserId) {
        if (active) setClientAvatarUrl("");
        return;
      }

      const { data } = await supabase.from("profiles").select("img_avatar,avatar_url").eq("id", resolvedUserId).maybeSingle();
      if (!active) return;

      setClientAvatarUrl(String((data as { img_avatar?: string | null; avatar_url?: string | null } | null)?.img_avatar || (data as { avatar_url?: string | null } | null)?.avatar_url || "").trim());
    }

    loadClientAvatar();

    return () => {
      active = false;
    };
  }, [supabase, resolvedUserId]);

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
      channel.unsubscribe();
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

    if (isOpen) {
      return;
    }

    let stopped = false;
    let timerId = 0;
    let hideTimerId = 0;

    function notifyIfBackground() {
      if (browserNudgeSentRef.current) return;
      if (typeof window === "undefined") return;
      if (!("Notification" in window)) return;
      if (document.visibilityState === "visible") return;
      if (Notification.permission !== "granted") return;

      browserNudgeSentRef.current = true;
      new Notification("AMYSA AI", {
        body: "Hola, ¿necesitas ayuda? Soy AMYSA AI y puedo ayudarte a escoger o buscar el mejor producto.",
      });
    }

    timerId = window.setTimeout(() => {
      if (stopped) return;

      setShowHelpNudge(true);
      notifyIfBackground();

      hideTimerId = window.setTimeout(() => {
        if (!stopped) {
          setShowHelpNudge(false);
        }
      }, 9000);
    }, 10000);

    return () => {
      stopped = true;
      window.clearTimeout(timerId);
      window.clearTimeout(hideTimerId);
    };
  }, [isOpen]);

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
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            sender: "assistant",
            content: `Para usar el asistente completo, inicia sesión: /login o regístrate gratis: /registro`,
          },
        ]);
        setIsLoading(false);
        sendLockRef.current = false;
        return;
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

      let replyText = String(data.reply || "").trim() || localFallback(text);

      const addToCartMatch = replyText.match(/\[AGREGAR:([^\]]+)\]/);
      if (addToCartMatch) {
        const productId = addToCartMatch[1].trim();
        replyText = replyText.replace(/\[AGREGAR:[^\]]+\]/, "").trim();
        const rec = Array.isArray(data.recommendations) ? data.recommendations.find((r) => r.id === productId) : null;
        if (rec) {
          addToCartStore({ productId: rec.id, name: rec.name, price: rec.price, image: rec.image });
          notify.success("Agregado al carrito", `${rec.name} se agregó a tu carrito.`);
        }
      }

      const messageId = makeId();
      setLastAnimatedMessageId(messageId);

      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          sender: "assistant",
          content: replyText || localFallback(text),
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
    <div className="fixed bottom-2 right-2 z-[120] sm:bottom-3 sm:right-3 md:bottom-4 md:right-4">
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
                  <div className="mx-auto rounded-full border border-border/70 bg-muted/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    {msg.content}
                  </div>
                ) : null}

                {msg.sender !== "system" && (msg.sender === "assistant" || msg.sender === "admin") ? (
                  <div className="mr-2 mt-1">
                      {msg.sender === "admin" ? (
                      <div className="grid size-7 place-content-center rounded-full border border-success/70 bg-success/90">
                        <UserRound className="size-4 text-success-foreground" />
                      </div>
                    ) : (
                      <div className="grid size-7 place-content-center rounded-full bg-gradient-to-br from-[#c49a82] to-[#a6785c]">
                        <svg viewBox="0 0 48 48" className="size-5" xmlns="http://www.w3.org/2000/svg">
                          <rect x="11" y="15" width="10" height="10" rx="2.5" fill="white" />
                          <rect x="27" y="15" width="10" height="10" rx="2.5" fill="white" />
                          <path d="M14 36 Q24 44, 34 36" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
                        </svg>
                      </div>
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
                        ? "border border-success/70 bg-success/95 text-foreground"
                        : "border border-white/40 bg-white/90 text-foreground"
                  }`}
                >
                  {msg.sender === "assistant" && !msg.content.includes("/registro") ? (
                    <TypingText text={msg.content} animate={msg.id === lastAnimatedMessageId} />
                  ) : (
                    <span>{msg.content.split(/(\/registro|\/login)/).map((part, i) => 
                      part === "/registro" ? <Link key={i} href="/registro" className="font-semibold underline">regístrate gratis</Link> :
                      part === "/login" ? <Link key={i} href="/login" className="font-semibold underline">inicia sesión</Link> :
                      part
                    )}</span>
                  )}

                  {msg.sender === "assistant" && msg.recommendations && msg.recommendations.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {msg.recommendations.map((item) => (
                        <Link key={item.id} href={getProductUrl(item)} className="block rounded-lg border border-primary/15 bg-white/90 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 hover:underline">
                          {item.name} — <span className="font-bold">S/ {Number(item.price).toFixed(2)}</span>
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
              className="absolute right-full top-1/2 mr-3 w-auto -translate-y-1/2 rounded-full border border-white/40 bg-gradient-to-r from-[#c49a82] to-[#a6785c] px-4 py-2 text-center text-xs font-semibold text-white shadow-lg transition hover:opacity-90 whitespace-nowrap"
              aria-label="Abrir asistencia AMYSA AI"
            >
              ¿Necesitas ayuda?
            </button>
          ) : null}

          <Button
            type="button"
            onClick={handleOpenChat}
            className="group relative size-16 rounded-full border border-white/40 bg-gradient-to-br from-[#c49a82] to-[#a6785c] p-0 text-white shadow-[0_18px_40px_rgba(95,58,44,0.28)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_24px_50px_rgba(95,58,44,0.36)] active:translate-y-0 active:scale-95 md:size-18 motion-safe:hover:animate-[bounce_0.75s_ease-in-out_1]"
            aria-label="Abrir AMYSA AI"
          >
            <span className="absolute -inset-1 rounded-full bg-[#c49a82]/30 blur-md transition-opacity duration-300 group-hover:opacity-100" />
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.25),transparent_28%)]" />
            <span className="absolute inset-0 rounded-full ring-1 ring-white/20" />
            <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full">
              <svg viewBox="0 0 48 48" className="size-11 md:size-12" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="16" cy="20" rx="5.5" ry="5.5" fill="white" />
                <ellipse cx="32" cy="20" rx="5.5" ry="5.5" fill="white">
                  <animate attributeName="ry" values="5.5;5.5;0.5;5.5" keyTimes="0;0.94;0.97;1" dur="4s" repeatCount="indefinite" />
                </ellipse>
                <path d="M14 36 Q24 44, 34 36" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </svg>
              <span className="sr-only">AMYSA AI</span>
            </div>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
