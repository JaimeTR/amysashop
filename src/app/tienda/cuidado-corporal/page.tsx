import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cuidado corporal",
  description: "Encuentra productos de cuidado corporal, hidratación y bienestar en AMYSA SHOP.",
  keywords: ["cuidado corporal", "hidratación", "bienestar", "AMYSA SHOP"],
};

export default function CuidadoCorporalPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Cuidado corporal</h1>
      <p>Productos para cuidado corporal (placeholder).</p>
    </main>
  );
}
