import { redirect } from "next/navigation";

// El admin digital ahora vive en el panel principal.
export default function DigitalAdminRedirect() {
  redirect("/admin/digitales");
}
