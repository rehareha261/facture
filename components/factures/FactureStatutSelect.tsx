"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateFactureStatut } from "@/lib/actions/factures";
import { STATUT_LABELS, STATUTS_MODIFIABLES } from "@/lib/facture-statut";
import type { StatutFacture } from "@/lib/types";

interface FactureStatutSelectProps {
  factureId: string;
  statut: StatutFacture;
}

export function FactureStatutSelect({ factureId, statut }: FactureStatutSelectProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (newStatut: StatutFacture) => {
    if (newStatut === statut) return;
    setLoading(true);
    setError(null);
    const result = await updateFactureStatut(factureId, newStatut);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Erreur");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <select
        value={statut}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value as StatutFacture)}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {STATUTS_MODIFIABLES.map((s) => (
          <option key={s} value={s}>
            {STATUT_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
