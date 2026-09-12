"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { StatutBadge } from "@/components/factures/StatutBadge";
import { FactureStatutSelect } from "@/components/factures/FactureStatutSelect";
import { deleteFacture } from "@/lib/actions/factures";
import { getStatutEffectif, STATUT_LABELS } from "@/lib/facture-statut";
import { formatMontant } from "@/lib/format";
import type { Client, FactureAvecClient, StatutFacture } from "@/lib/types";

interface FacturesListProps {
  factures: FactureAvecClient[];
  clients: Pick<Client, "id" | "nom">[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

export function FacturesList({ factures, clients }: FacturesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtreStatut = searchParams.get("statut") ?? "";
  const filtreClient = searchParams.get("client") ?? "";
  const filtreDebut = searchParams.get("debut") ?? "";
  const filtreFin = searchParams.get("fin") ?? "";

  const facturesFiltrees = useMemo(() => {
    return factures.filter((f) => {
      const statutEffectif = getStatutEffectif(f);
      if (filtreStatut && statutEffectif !== filtreStatut) return false;
      if (filtreClient && f.client_id !== filtreClient) return false;
      if (filtreDebut && f.date_emission < filtreDebut) return false;
      if (filtreFin && f.date_emission > filtreFin) return false;
      return true;
    });
  }, [factures, filtreStatut, filtreClient, filtreDebut, filtreFin]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/factures?${params.toString()}`);
  };

  const handleDelete = async (facture: FactureAvecClient) => {
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
      {/* Filtres */}
      <div className="mb-6 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Statut</label>
          <select
            value={filtreStatut}
            onChange={(e) => updateFilter("statut", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {(Object.keys(STATUT_LABELS) as StatutFacture[]).map((s) => (
              <option key={s} value={s}>
                {STATUT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Client</label>
          <select
            value={filtreClient}
            onChange={(e) => updateFilter("client", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
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
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Émission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Statut
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                  Total TTC
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
                    {facture.clients?.nom ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {fmtDate(facture.date_emission)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <StatutBadge facture={facture} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                    {formatMontant(facture.total_ttc)}
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
                      <FactureStatutSelect factureId={facture.id} statut={facture.statut} />
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
