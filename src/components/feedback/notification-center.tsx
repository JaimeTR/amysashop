"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, BellRing, CheckCircle2, MessageSquareQuote, Trash2, X, type LucideIcon } from "lucide-react";

type NotificationVariant = "success" | "error" | "warning" | "info" | "delete" | "query";

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
    iconClass: "text-emerald-700",
    cardClass: "border-emerald-200/70 bg-emerald-50/90",
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-rose-700",
    cardClass: "border-rose-200/80 bg-rose-50/95",
  },
  warning: {
    icon: BellRing,
    iconClass: "text-amber-700",
    cardClass: "border-amber-200/80 bg-amber-50/95",
  },
  info: {
    icon: BellRing,
    iconClass: "text-sky-700",
    cardClass: "border-sky-200/80 bg-sky-50/95",
  },
  delete: {
    icon: Trash2,
    iconClass: "text-orange-700",
    cardClass: "border-orange-200/80 bg-orange-50/95",
  },
  query: {
    icon: MessageSquareQuote,
    iconClass: "text-violet-700",
    cardClass: "border-violet-200/80 bg-violet-50/95",
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
  }), [notify]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] mx-auto flex w-full max-w-md flex-col gap-2 px-3 sm:px-4 md:max-w-3xl md:top-4 md:bottom-auto">
        {notifications.slice(0, isMobile ? 2 : 4).map((item) => {
          const style = stylesByVariant[item.variant];
          const Icon = style.icon;

          return (
            <article
              key={item.id}
              className={`notify-enter pointer-events-auto overflow-hidden rounded-xl border shadow-md backdrop-blur-md ${style.cardClass}`}
            >
              <div className="flex items-start gap-2.5 p-2.5 sm:gap-3 sm:p-3">
                <Icon className={`mt-0.5 size-4 shrink-0 sm:size-5 ${style.iconClass}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground sm:text-sm">{item.title}</p>
                  {item.description && !isMobile ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="rounded-full p-0.5 text-muted-foreground transition hover:bg-black/5 hover:text-foreground sm:p-1"
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
