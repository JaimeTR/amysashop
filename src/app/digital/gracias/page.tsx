import { redirect } from "next/navigation";

// Página antigua: el flujo actual muestra el estado en /digital/pedido/[id].
export default function DigitalGraciasPage() {
  redirect("/digital/descargas");
}
