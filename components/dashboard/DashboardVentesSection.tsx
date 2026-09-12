"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VentesMensuellesChart } from "@/components/dashboard/VentesMensuellesChart";
import {
  aggregerVentesMensuelles,
  anneesDisponibles,
} from "@/lib/dashboard-ventes";
import { exportVentesExcel } from "@/lib/export-ventes-excel";
import type { Facture } from "@/lib/types";

interface DashboardVentesSectionProps {
  factures: Facture[];
  anneeDefaut: number;
}

export function DashboardVentesSection({
  factures,
  anneeDefaut,
}: DashboardVentesSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const annees = useMemo(() => anneesDisponibles(factures), [factures]);

  const anneeInitiale = (() => {
    const p = searchParams.get("annee");
    if (p) {
      const n = parseInt(p, 10);
      if (!Number.isNaN(n) && annees.includes(n)) return n;
    }
    return annees.includes(anneeDefaut) ? anneeDefaut : annees[0];
  })();

  const [anneeRef, setAnneeRef] = useState(anneeInitiale);

  const chartData = useMemo(
    () => aggregerVentesMensuelles(factures, anneeRef),
    [factures, anneeRef]
  );

  const changerAnnee = (annee: number) => {
    setAnneeRef(annee);
    const params = new URLSearchParams(searchParams.toString());
    params.set("annee", String(annee));
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="annee-ref" className="text-sm font-medium text-zinc-700">
            Année :
          </label>
          <select
            id="annee-ref"
            value={anneeRef}
            onChange={(e) => changerAnnee(parseInt(e.target.value, 10))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {annees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => exportVentesExcel(chartData)}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Exporter Excel
        </button>
      </div>
      <VentesMensuellesChart data={chartData} />
    </div>
  );
}
