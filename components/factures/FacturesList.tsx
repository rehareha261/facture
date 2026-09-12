"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { deleteFacture } from "@/lib/actions/factures";
import { factureContientProduit } from "@/lib/facture-filtre-produit";
import { formatMontant } from "@/lib/format";
import type { FactureAvecLignes, Produit } from "@/lib/types";

interface FacturesListProps {
  factures: FactureAvecLignes[];
  produits: Pick<Produit, "id" | "designation">[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

export function FacturesList({ factures, produits }: FacturesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtreNumero = searchParams.get("numero") ?? "";
  const filtreProduit = searchParams.get("produit") ?? "";
  const filtreDebut = searchParams.get("debut") ?? "";
  const filtreFin = searchParams.get("fin") ?? "";

  const produitSelectionne = useMemo(
    () => produits.find((p) => p.id === filtreProduit) ?? null,
    [produits, filtreProduit]
  );

  const facturesFiltrees = useMemo(() => {
    const qNumero = filtreNumero.trim().toLowerCase();
    return factures.filter((f) => {
      if (qNumero && !f.numero.toLowerCase().includes(qNumero)) return false;
      if (filtreDebut && f.date_emission < filtreDebut) return false;
      if (filtreFin && f.date_emission > filtreFin) return false;
      if (
        filtreProduit &&
        produitSelectionne &&
        !factureContientProduit(f, filtreProduit, produitSelectionne.designation)
      ) {
        return false;
      }
      return true;
    });
  }, [factures, filtreNumero, filtreProduit, produitSelectionne, filtreDebut, filtreFin]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/factures?${params.toString()}`);
  };

  const handleDelete = async (facture: FactureAvecLignes) => {
    const confirmed = window.confirm(
      `Supprimer la facture ${facture.numero} ? Cette action est irréversible.`
    );
    if (!confirmed) return;
    setDeletingId(facture.id);
    setDeleteError(null);
    const result = await deleteFacture(facture.id);
    setDeletingId(null);
    if (!result.success) {
      setDeleteError(result.error ?? "Erreur");
      return;
    }
    router.refresh();
  };

  return (
    <>
      <div className="mb-6 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">N° facture</label>
          <input
            type="text"
            placeholder="FAC-2026-001…"
            value={filtreNumero}
            onChange={(e) => updateFilter("numero", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Produit</label>
          <select
            value={filtreProduit}
            onChange={(e) => updateFilter("produit", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {produits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.designation}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Du</label>
          <input
            type="date"
            value={filtreDebut}
            onChange={(e) => updateFilter("debut", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Au</label>
          <input
            type="date"
            value={filtreFin}
            onChange={(e) => updateFilter("fin", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {deleteError && (
        <div className="mb-4">
          <Alert variant="error">{deleteError}</Alert>
        </div>
      )}

      {facturesFiltrees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-zinc-500">
          Aucune facture trouvée.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  N°
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Émission
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                  Total HT
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {facturesFiltrees.map((facture) => (
                <tr key={facture.id} className="hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                    <Link
                      href={`/factures/${facture.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {facture.numero}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {fmtDate(facture.date_emission)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                    {formatMontant(facture.total_ht)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {facture.pdf_url && (
                        <a
                          href={facture.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          PDF
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(facture)}
                        disabled={deletingId === facture.id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Suppr.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
