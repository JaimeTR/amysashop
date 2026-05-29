"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SalespersonOption = {
  id: string;
  name: string;
};

type Props = {
  salespeople: SalespersonOption[];
  selectedSalespersonId: string;
  selectedSalespersonName: string | null;
  totalCommissionDue: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function EmprendeSalespersonFilter({
  salespeople,
  selectedSalespersonId,
  selectedSalespersonName,
  totalCommissionDue,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value) {
      nextParams.set("salespersonId", value);
    } else {
      nextParams.delete("salespersonId");
    }

    startTransition(() => {
      const queryString = nextParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
      <div className="flex h-10 items-center rounded-full border border-primary/15 bg-primary/5 px-3 text-sm text-primary">
        Comisión a pagar: <span className="ml-1 font-semibold">{formatMoney(totalCommissionDue)}</span>
        {selectedSalespersonName ? <span className="ml-2 text-xs text-primary/70">{selectedSalespersonName}</span> : null}
      </div>

      <select
        name="salespersonId"
        value={selectedSalespersonId}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        className="flex h-10 min-w-[240px] rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Todas las ventas</option>
        {salespeople.map((salesperson) => (
          <option key={salesperson.id} value={salesperson.id}>
            {salesperson.name}
          </option>
        ))}
      </select>
    </div>
  );
}