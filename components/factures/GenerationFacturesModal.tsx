"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { createFacturesBatch } from "@/lib/actions/factures";
import {
  genererFacturesMois,
  verifierTotalMois,
  type FactureGeneree,
} from "@/lib/generer-lignes-ventes";
import { formatMontant } from "@/lib/format";
import type { Produit } from "@/lib/types";

const MOIS_OPTIONS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

interface GenerationFacturesModalProps {
  open: boolean;
  onClose: () => void;
  produits: Produit[];
}

function parseMontant(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function GenerationFacturesModal({
  open,
  onClose,
  produits,
}: GenerationFacturesModalProps) {
  const router = useRouter();
  const now = new Date();

  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [montantRaw, setMontantRaw] = useState("");
  const [preview, setPreview] = useState<FactureGeneree[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const produitsRef = useMemo(
    () =>
      produits.map((p) => ({
        id: p.id,
        designation: p.designation,
        prix_unitaire_ht: Number(p.prix_unitaire_ht),
      })),
    [produits]
  );

  const verification = useMemo(() => {
    if (!preview) return null;
    const cible = parseMontant(montantRaw);
    if (!cible) return null;
    return verifierTotalMois(preview, cible);
  }, [preview, montantRaw]);

  const handleClose = () => {
    setPreview(null);
    setExpanded(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handlePreview = () => {
    setError(null);
    setSuccess(null);

    if (produitsRef.length === 0) {
      setError("Importez d'abord des produits dans le catalogue.");
      return;
    }

    const montant = parseMontant(montantRaw);
    if (!montant) {
      setError("Montant HT total invalide.");
      return;
    }

    const factures = genererFacturesMois(annee, mois, montant, produitsRef).sort((a, b) =>
      a.date_emission.localeCompare(b.date_emission)
    );

    setPreview(factures);
    setExpanded(null);
  };

  const handleValidate = async () => {
    if (!preview?.length) return;

    setLoading(true);
    setError(null);

    const result = await createFacturesBatch(
      preview.map((f) => ({
        date_emission: f.date_emission,
        lignes: f.lignes.map((l) => ({
          produit_id: l.produit_id,
          designation: l.designation,
          quantite: l.quantite,
          prix_unitaire_ht: l.prix_unitaire_ht,
        })),
      }))
    );

    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Erreur lors de l'enregistrement.");
      return;
    }

    setSuccess(`${result.count} facture(s) enregistrée(s).`);
    router.refresh();
    setTimeout(() => {
      handleClose();
      router.push("/factures");
    }, 800);
  };

  const anneesOptions = useMemo(() => {
    const anneeCourante = now.getFullYear();
    const list: number[] = [];
    for (let y = anneeCourante; y >= 2000; y--) list.push(y);
    return list;
  }, [now]);

  return (
    <Modal open={open} onClose={handleClose} title="Génération automatique de factures" wide>
      <div className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Mois</label>
            <select
              value={mois}
              onChange={(e) => {
                setMois(parseInt(e.target.value, 10));
                setPreview(null);
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              {MOIS_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Année</label>
            <select
              value={annee}
              onChange={(e) => {
                setAnnee(parseInt(e.target.value, 10));
                setPreview(null);
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              {anneesOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Montant HT total
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="23 315 200"
              value={montantRaw}
              onChange={(e) => {
                setMontantRaw(e.target.value);
                setPreview(null);
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 disabled:opacity-50"
          >
            Prévisualiser
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={loading}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Modifier les paramètres
            </button>
          )}
        </div>

        {preview && verification && (
          <>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
              <p>
                <strong>{preview.length}</strong> facture(s) — Total HT :{" "}
                <strong>{formatMontant(verification.obtenu)}</strong>
                {!verification.ok && (
                  <span className="ml-2 text-amber-700">
                    (écart : {formatMontant(verification.ecart)})
                  </span>
                )}
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="sticky top-0 bg-zinc-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Date</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-500">Lignes</th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-500">Total HT</th>
                    <th className="w-8 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {preview.map((facture, index) => (
                    <Fragment key={`${facture.date_emission}-${index}`}>
                      <tr className="hover:bg-zinc-50">
                        <td className="px-3 py-2">{fmtDate(facture.date_emission)}</td>
                        <td className="px-3 py-2 text-right">{facture.lignes.length}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatMontant(facture.total_ht)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded(expanded === index ? null : index)
                            }
                            className="text-blue-600 hover:underline"
                          >
                            {expanded === index ? "−" : "+"}
                          </button>
                        </td>
                      </tr>
                      {expanded === index && (
                        <tr className="bg-zinc-50">
                          <td colSpan={4} className="px-3 py-2">
                            <ul className="space-y-1 text-xs text-zinc-600">
                              {facture.lignes.map((l, i) => (
                                <li key={i}>
                                  {l.quantite} × {l.designation} @{" "}
                                  {formatMontant(l.prix_unitaire_ht)} ={" "}
                                  {formatMontant(l.quantite * l.prix_unitaire_ht)}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleValidate}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Enregistrement…" : "Valider et enregistrer"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
