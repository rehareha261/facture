"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { deleteFacture } from "@/lib/actions/factures";
import { fetchAndDownloadFacturePdf } from "@/lib/download-facture-pdf";
import { formatMontant } from "@/lib/format";
import type { Facture } from "@/lib/types";

interface FacturesListProps {
  factures: Facture[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

export function FacturesList({ factures }: FacturesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");

  const filtreNumero = searchParams.get("numero") ?? "";
  const filtreDebut = searchParams.get("debut") ?? "";
  const filtreFin = searchParams.get("fin") ?? "";

  const allSelected = factures.length > 0 && factures.every((f) => selected.has(f.id));
  const someSelected = factures.some((f) => selected.has(f.id));

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/factures?${params.toString()}`);
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(factures.map((f) => f.id)));
    }
  };

  const handleDelete = async (facture: Facture) => {
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
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(facture.id);
      return next;
    });
    router.refresh();
  };

  const handleBulkPdf = async () => {
    const ids = factures.filter((f) => selected.has(f.id)).map((f) => f.id);
    if (ids.length === 0) return;

    setPdfLoading(true);
    setActionError(null);

    const errors: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      const facture = factures.find((f) => f.id === id);
      setPdfProgress(`${i + 1} / ${ids.length} — ${facture?.numero ?? ""}`);

      const result = await fetchAndDownloadFacturePdf(id);
      if (!result.ok) {
        errors.push(`${facture?.numero ?? id} : ${result.error}`);
      }
    }

    setPdfLoading(false);
    setPdfProgress("");

    if (errors.length > 0) {
      setActionError(`${errors.length} échec(s) : ${errors.slice(0, 3).join(" · ")}`);
    }
  };

  return (
    <>
      <div className="mb-6 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {(deleteError || actionError) && (
        <div className="mb-4">
          <Alert variant="error">{deleteError ?? actionError}</Alert>
        </div>
      )}

      {someSelected && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-900">
            {selected.size} facture{selected.size > 1 ? "s" : ""} sélectionnée
            {selected.size > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleBulkPdf}
            disabled={pdfLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pdfLoading ? `Génération… ${pdfProgress}` : "Générer les PDF"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={pdfLoading}
            className="text-sm text-blue-700 hover:underline disabled:opacity-50"
          >
            Tout désélectionner
          </button>
        </div>
      )}

      {factures.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-zinc-500">
          Aucune facture trouvée.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Tout sélectionner"
                    className="rounded border-zinc-300"
                  />
                </th>
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
              {factures.map((facture) => (
                <tr
                  key={facture.id}
                  className={`hover:bg-zinc-50 ${selected.has(facture.id) ? "bg-blue-50/40" : ""}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(facture.id)}
                      onChange={() => toggleOne(facture.id)}
                      aria-label={`Sélectionner ${facture.numero}`}
                      className="rounded border-zinc-300"
                    />
                  </td>
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
                      <button
                        type="button"
                        onClick={() => handleDelete(facture)}
                        disabled={deletingId === facture.id || pdfLoading}
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
