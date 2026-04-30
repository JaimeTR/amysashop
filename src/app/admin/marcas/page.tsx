import { BrandManagementPanel } from "@/components/admin/brand-management-panel";

export const metadata = {
  title: "Gestión de Marcas - Admin",
  description: "Administra las marcas del sistema",
};

export default function BrandManagementPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Marcas</h1>
        <p className="mt-1 text-muted-foreground">
          Administra las marcas disponibles en la tienda
        </p>
      </div>

      <BrandManagementPanel />
    </div>
  );
}
