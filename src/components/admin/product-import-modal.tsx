"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/components/feedback/notification-center";

type Props = {
  importProductsAction: (formData: FormData) => Promise<void>;
};

export function ProductImportModal({ importProductsAction }: Props) {
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setFileName(file?.name || null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      await importProductsAction(formData);
      notify.success("Importación completada", "Los productos se han importado correctamente");

      setTimeout(() => {
        setOpen(false);
        setFileName(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 500);
    } catch (error) {
      notify.error(
        "Error en importación",
        error instanceof Error ? error.message : "No se pudo importar el archivo CSV"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="mr-2 size-4" />
        Importar CSV
      </Button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-4" onClick={() => setOpen(false)}>
              <div
                className="w-full max-w-xl rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Importación masiva</p>
                    <h2 className="font-[var(--font-display)] text-3xl text-foreground">Productos desde CSV</h2>
                  </div>
                  <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)} disabled={loading}>
                    <X className="size-4" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="rounded-xl border border-[#e3d7cd] bg-[#fcf8f5] p-3 text-xs text-black/80">
                    <p className="font-semibold">Columnas esperadas (encabezados):</p>
                    <p className="mt-1">
                      nombre, codigo/sku, marca, submarca, categoria, subcategoria, precio, precio_anterior, stock,
                      descripcion, foto_principal, galeria, activo
                    </p>
                    <p className="mt-1">Foto principal: una sola URL. Galería: varias URLs separadas por | o coma.</p>
                  </div>

                  <div>
                    <label htmlFor="csvFile" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/80">Archivo CSV</label>
                    <div className="relative">
                      <input
                        id="csvFile"
                        ref={fileInputRef}
                        type="file"
                        name="csvFile"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                        required
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                      <div className={`flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-dashed ${fileName ? "border-success/70 bg-success/90" : "border-primary/35 bg-card"} text-sm ${fileName ? "text-success-foreground font-medium" : "text-foreground/80"}`}>
                        <Upload className={`size-4 ${fileName ? "text-success-foreground" : "text-primary"}`} />
                        {fileName ? `✓ ${fileName}` : "Seleccionar archivo CSV"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-[#e3d7cd] pt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading || !fileName} className="flex-1">
                      {loading ? "Importando..." : "Importar productos"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}