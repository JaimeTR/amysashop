"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, BellRing, CheckCircle2, MessageSquareQuote, Trash2, X, MailCheck, type LucideIcon } from "lucide-react";

type NotificationVariant = "success" | "error" | "warning" | "info" | "delete" | "query" | "verification";

type NotificationInput = {
  title: string;
  description?: string;
  variant?: NotificationVariant;
  durationMs?: number;
};

type NotificationItem = NotificationInput & {
  id: string;
  variant: NotificationVariant;
};

type NotificationContextValue = {
  notify: (input: NotificationInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  removed: (title: string, description?: string) => void;
  query: (title: string, description?: string) => void;
  verification: (title: string, description?: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const DEFAULT_DURATION = 4600;

function createNotificationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `notify-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const stylesByVariant: Record<
  NotificationVariant,
  {
    icon: LucideIcon;
    iconClass: string;
    cardClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-[#1B5E20]",
    cardClass: "border-[#81C784]/50 bg-[#E8F5E9] text-[#1B5E20]",
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-[#B71C1C]",
    cardClass: "border-[#EF9A9A]/50 bg-[#FFEBEE] text-[#B71C1C]",
  },
  warning: {
    icon: BellRing,
    iconClass: "text-[#E65100]",
    cardClass: "border-[#FFCC80]/50 bg-[#FFF3E0] text-[#E65100]",
  },
  info: {
    icon: BellRing,
    iconClass: "text-[#0D47A1]",
    cardClass: "border-[#90CAF9]/50 bg-[#E3F2FD] text-[#0D47A1]",
  },
  delete: {
    icon: Trash2,
    iconClass: "text-[#B71C1C]",
    cardClass: "border-[#EF9A9A]/50 bg-[#FFEBEE] text-[#B71C1C]",
  },
  query: {
    icon: MessageSquareQuote,
    iconClass: "text-[#4A148C]",
    cardClass: "border-[#CE93D8]/50 bg-[#F3E5F5] text-[#4A148C]",
  },
  verification: {
    icon: MailCheck,
    iconClass: "text-[#004D40]",
    cardClass: "border-[#80DEEA]/50 bg-[#E0F2F1] text-[#004D40]",
  },
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const updateIsMobile = () => {
      setIsMobile(media.matches);
    };

    updateIsMobile();

    media.addEventListener("change", updateIsMobile);

    return () => {
      media.removeEventListener("change", updateIsMobile);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((input: NotificationInput) => {
    const id = createNotificationId();
    const item: NotificationItem = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "info",
      durationMs: input.durationMs ?? DEFAULT_DURATION,
    };

    setNotifications((current) => [item, ...current].slice(0, 4));

    window.setTimeout(() => {
      dismiss(id);
    }, item.durationMs ?? DEFAULT_DURATION);
  }, [dismiss]);

  const contextValue = useMemo<NotificationContextValue>(() => ({
    notify,
    success: (title, description) => notify({ title, description, variant: "success" }),
    error: (title, description) => notify({ title, description, variant: "error" }),
    warning: (title, description) => notify({ title, description, variant: "warning" }),
    info: (title, description) => notify({ title, description, variant: "info" }),
    removed: (title, description) => notify({ title, description, variant: "delete" }),
    query: (title, description) => notify({ title, description, variant: "query" }),
    verification: (title, description) => notify({ title, description, variant: "verification" }),
  }), [notify]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-md flex-col gap-2">
        {notifications.slice(0, isMobile ? 2 : 4).map((item) => {
          const style = stylesByVariant[item.variant];
          const Icon = style.icon;

          return (
            <article
              key={item.id}
              className={`notify-enter pointer-events-auto overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-2 ${style.cardClass}`}
            >
              <div className="flex items-start gap-2.5 p-2.5 sm:gap-3 sm:p-3">
                <Icon className={`mt-0.5 size-4 shrink-0 sm:size-5 ${style.iconClass}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold sm:text-sm ${style.iconClass}`}>{item.title}</p>
                  {item.description && !isMobile ? (
                    <p className={`mt-0.5 text-xs opacity-85 ${style.iconClass}`}>{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className={`rounded-full p-0.5 transition hover:opacity-70 sm:p-1 ${style.iconClass}`}
                  aria-label="Cerrar notificación"
                >
                  <X className="size-3.5 sm:size-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotify debe usarse dentro de NotificationProvider");
  }

  return context;
}
