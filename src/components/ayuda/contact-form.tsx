"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  name: string;
  email: string;
  message: string;
  loading: boolean;
  status: null | "ok" | "error";
};

type FormAction =
  | { type: "set_name"; payload: string }
  | { type: "set_email"; payload: string }
  | { type: "set_message"; payload: string }
  | { type: "set_loading"; payload: boolean }
  | { type: "set_status"; payload: null | "ok" | "error" }
  | { type: "reset" };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set_name":
      return { ...state, name: action.payload };
    case "set_email":
      return { ...state, email: action.payload };
    case "set_message":
      return { ...state, message: action.payload };
    case "set_loading":
      return { ...state, loading: action.payload };
    case "set_status":
      return { ...state, status: action.payload };
    case "reset":
      return { name: "", email: "", message: "", loading: false, status: null };
    default:
      return state;
  }
}

export default function ContactForm() {
  const router = useRouter();
  const [state, dispatch] = useReducer(formReducer, {
    name: "",
    email: "",
    message: "",
    loading: false,
    status: null,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "set_loading", payload: true });
    dispatch({ type: "set_status", payload: null });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.name, email: state.email, message: state.message }),
      });

      if (res.ok) {
        dispatch({ type: "set_status", payload: "ok" });
        router.push(`/gracias/contacto?nombre=${encodeURIComponent(state.name.trim())}`);
        dispatch({ type: "reset" });
      } else {
        dispatch({ type: "set_status", payload: "error" });
      }
    } catch (err) {
      dispatch({ type: "set_status", payload: "error" });
    } finally {
      dispatch({ type: "set_loading", payload: false });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium">Nombre</label>
        <input
          id="contact-name"
          required
          value={state.name}
          onChange={(e) => dispatch({ type: "set_name", payload: e.target.value })}
          placeholder="Tu nombre"
          className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium">Correo</label>
        <input
          id="contact-email"
          required
          type="email"
          value={state.email}
          onChange={(e) => dispatch({ type: "set_email", payload: e.target.value })}
          placeholder="tu@correo.com"
          className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium">Mensaje</label>
        <textarea
          id="contact-message"
          required
          value={state.message}
          onChange={(e) => dispatch({ type: "set_message", payload: e.target.value })}
          rows={5}
          placeholder="Escribe tu mensaje..."
          className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state.loading}
          className="rounded bg-primary px-4 py-2 text-white disabled:opacity-60"
        >
          {state.loading ? "Enviando..." : "Enviar mensaje"}
        </button>

        {state.status === "ok" && <span className="text-sm text-success-foreground">Mensaje enviado correctamente.</span>}
        {state.status === "error" && <span className="text-sm text-destructive-foreground">Error al enviar, intenta nuevamente.</span>}
      </div>

      {state.status === "ok" && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          ¡Gracias! Tu mensaje fue enviado correctamente.
        </div>
      )}
      {state.status === "error" && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          Error al enviar. Intenta de nuevo.
        </div>
      )}
    </form>
  );
}
