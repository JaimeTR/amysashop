import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maquillaje",
  description: "Descubre maquillaje, productos de belleza y esenciales para tu rutina en AMYSA SHOP.",
  keywords: ["maquillaje", "belleza", "cosméticos", "AMYSA SHOP"],
};

export default function MaquillajePage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Maquillaje</h1>
      <p>Listado de productos de maquillaje (placeholder).</p>
    </main>
  );
}
