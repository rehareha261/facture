"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { calculerLigne } from "@/lib/facture-calculs";
import { formatMontant } from "@/lib/format";
import { MODELE_FACTURE } from "@/lib/facture-modele";
import { AuditInfo } from "@/components/admin/AuditInfo";
import type { AuditDisplay, FactureComplete } from "@/lib/types";

interface FactureDetailViewProps {
  facture: FactureComplete;
  audit?: AuditDisplay;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

export function FactureDetailView({ facture, audit }: FactureDetailViewProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const lignes = [...facture.lignes_facture].sort((a, b) => a.ordre - b.ordre);

  const handleRegeneratePdf = async () => {
    setPdfLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factureId: facture.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la génération.");
        setPdfLoading(false);
        return;
      }
      const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    }
    setPdfLoading(false);
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Facture {facture.numero}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Émise le {fmtDate(facture.date_emission)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {facture.pdf_url && (
            <a
              href={facture.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Voir le PDF
            </a>
          )}
          <button
            type="button"
            onClick={handleRegeneratePdf}
            disabled={pdfLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pdfLoading ? "Génération…" : facture.pdf_url ? "Régénérer le PDF" : "Générer le PDF"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 text-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase text-zinc-500">Modèle facture</h2>
          <p className="font-semibold text-zinc-900">{MODELE_FACTURE.nom}</p>
          <p className="text-zinc-600">{MODELE_FACTURE.adresse}</p>
          <p className="text-zinc-600">{MODELE_FACTURE.nifStat}</p>
          <p className="text-zinc-600">{MODELE_FACTURE.activite}</p>
          <p className="mt-2">
            <span className="text-zinc-500">Doit : </span>
            {MODELE_FACTURE.doit}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase text-zinc-500">Dates</h2>
          <p className="text-sm">
            <span className="text-zinc-500">Émission : </span>
            {fmtDate(facture.date_emission)}
          </p>
          {facture.date_echeance && (
            <p className="text-sm">
              <span className="text-zinc-500">Échéance : </span>
              {fmtDate(facture.date_echeance)}
            </p>
          )}
          {facture.mode_paiement && (
            <p className="mt-2 text-sm">
              <span className="text-zinc-500">Mode paiement : </span>
              {facture.mode_paiement}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Désignation
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                Qté
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                Prix HT
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                Montant
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {lignes.map((ligne) => {
              const { ht } = calculerLigne(
                ligne.quantite,
                ligne.prix_unitaire_ht,
                ligne.taux_tva
              );
              return (
                <tr key={ligne.id}>
                  <td className="px-4 py-3 text-sm text-zinc-900">{ligne.designation}</td>
                  <td className="px-4 py-3 text-right text-sm">{ligne.quantite}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {formatMontant(ligne.prix_unitaire_ht)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {formatMontant(ht)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="space-y-1 text-right text-sm">
          <p>
            Total HT : <strong>{formatMontant(facture.total_ht)}</strong>
          </p>
          <p>
            TVA {lignes[0]?.taux_tva ?? 20} % :{" "}
            <strong>{formatMontant(facture.total_tva)}</strong>
          </p>
          <p className="text-lg">
            Total TTC : <strong>{formatMontant(facture.total_ttc)}</strong>
          </p>
        </div>
      </div>

      {facture.notes && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-600">{facture.notes}</p>
        </div>
      )}

      {audit && (
        <div className="mt-4">
          <AuditInfo audit={audit} />
        </div>
      )}

      <Link href="/factures" className="text-sm text-blue-600 hover:underline">
        ← Retour aux factures
      </Link>
    </div>
  );
}
