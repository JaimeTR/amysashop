import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfumes",
  description: "Explora perfumes, fragancias y opciones para regalar en la tienda de AMYSA SHOP.",
  keywords: ["perfumes", "fragancias", "perfumería", "AMYSA SHOP"],
};

export default function PerfumesPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Perfumes</h1>
      <p>Listado de perfumes (placeholder).</p>
    </main>
  );
}
