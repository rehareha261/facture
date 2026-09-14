"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { restoreElement } from "@/lib/actions/admin";
import { formatAuditDate } from "@/lib/audit-utils";
import type { CorbeilleElement, CorbeilleFiltre } from "@/lib/soft-delete";

const FILTRES: { value: CorbeilleFiltre; label: string }[] = [
  { value: "actifs", label: "Actifs" },
  { value: "supprimes", label: "Supprimés" },
  { value: "tous", label: "Tous" },
];

const TYPE_LABELS: Record<CorbeilleElement["type"], string> = {
  facture: "Facture",
  produit: "Produit",
  entreprise: "Entreprise",
};

interface AdminCorbeilleManagerProps {
  elements: CorbeilleElement[];
  filtre: CorbeilleFiltre;
}

export function AdminCorbeilleManager({ elements, filtre }: AdminCorbeilleManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const changerFiltre = (value: CorbeilleFiltre) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "actifs") params.delete("corbeille");
    else params.set("corbeille", value);
    router.push(`/admin?${params.toString()}`);
  };

  const handleRestore = async (element: CorbeilleElement) => {
    if (!window.confirm(`Restaurer « ${element.label} » ?`)) return;

    setRestoringId(element.id);
    setError(null);
    const result = await restoreElement(element.type, element.id);
    setRestoringId(null);

    if (!result.success) {
      setError(result.error ?? "Restauration impossible.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-700">Afficher :</span>
        {FILTRES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => changerFiltre(f.value)}
            className={
              filtre === f.value
                ? "rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {elements.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun élément pour ce filtre.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Libellé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Dernière modif.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {elements.map((el) => (
                <tr key={`${el.type}-${el.id}`} className={el.deleted_at ? "bg-red-50/40" : ""}>
                  <td className="px-4 py-3 text-zinc-500">{TYPE_LABELS[el.type]}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{el.label}</td>
                  <td className="px-4 py-3">
                    {el.deleted_at ? (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        Supprimé
                      </span>
                    ) : (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{formatAuditDate(el.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {el.deleted_at && (
                      <button
                        type="button"
                        onClick={() => handleRestore(el)}
                        disabled={restoringId === el.id}
                        className="font-medium text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {restoringId === el.id ? "Restauration…" : "Restaurer"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
