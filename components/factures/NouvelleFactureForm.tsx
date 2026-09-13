"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { CataloguePickerModal } from "@/components/factures/CataloguePickerModal";
import { GenerationFacturesModal } from "@/components/factures/GenerationFacturesModal";
import { createFacture } from "@/lib/actions/factures";
import { fetchAndDownloadFacturePdf } from "@/lib/download-facture-pdf";
import { calculerLigne, calculerTotauxFacture } from "@/lib/facture-calculs";
import { formatMontant } from "@/lib/format";
import { MODELE_FACTURE } from "@/lib/facture-modele";
import type { Entreprise, LigneFactureDraft, Produit } from "@/lib/types";

interface NouvelleFactureFormProps {
  produits: Produit[];
  entreprises: Entreprise[];
  defaultNumero: string;
  numeroError?: string | null;
}

function newTempId() {
  return `ligne-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyLigne(tauxTva: number): LigneFactureDraft {
  return {
    tempId: newTempId(),
    produit_id: null,
    designation: "",
    quantite: 1,
    prix_unitaire_ht: 0,
    taux_tva: tauxTva,
  };
}

export function NouvelleFactureForm({
  produits,
  entreprises,
  defaultNumero,
  numeroError,
}: NouvelleFactureFormProps) {
  const router = useRouter();
  const [entrepriseId, setEntrepriseId] = useState(entreprises[0]!.id);
  const [numero, setNumero] = useState(defaultNumero);
  const [dateEmission, setDateEmission] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [modePaiement, setModePaiement] = useState<string>(MODELE_FACTURE.modePaiementDefaut);
  const [lignes, setLignes] = useState<LigneFactureDraft[]>([]);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [factureId, setFactureId] = useState<string | null>(null);
  const [generationOpen, setGenerationOpen] = useState(false);

  const entrepriseSelectionnee = useMemo(
    () => entreprises.find((e) => e.id === entrepriseId) ?? entreprises[0]!,
    [entreprises, entrepriseId]
  );
  const tauxTva = entrepriseSelectionnee.taux_tva;

  const handleEntrepriseChange = (id: string) => {
    setEntrepriseId(id);
    const nouveauTaux = entreprises.find((e) => e.id === id)?.taux_tva ?? tauxTva;
    setLignes((prev) => prev.map((l) => ({ ...l, taux_tva: nouveauTaux })));
  };

  const lignesAvecTva = useMemo(
    () => lignes.map((l) => ({ ...l, taux_tva: tauxTva })),
    [lignes, tauxTva]
  );
  const totaux = useMemo(() => calculerTotauxFacture(lignesAvecTva), [lignesAvecTva]);

  const updateLigne = (tempId: string, patch: Partial<LigneFactureDraft>) => {
    setLignes((prev) =>
      prev.map((l) => (l.tempId === tempId ? { ...l, ...patch } : l))
    );
  };

  const removeLigne = (tempId: string) => {
    setLignes((prev) => prev.filter((l) => l.tempId !== tempId));
  };

  const addFromCatalogue = (produit: Produit) => {
    setLignes((prev) => [
      ...prev,
      {
        tempId: newTempId(),
        produit_id: produit.id,
        designation: produit.designation,
        quantite: 1,
        prix_unitaire_ht: produit.prix_unitaire_ht,
        taux_tva: tauxTva,
      },
    ]);
  };

  const handleSave = async (options?: { silent?: boolean }): Promise<string | null> => {
    if (!options?.silent) setLoading(true);
    setError(null);

    const result = await createFacture({
      entreprise_id: entrepriseId,
      numero,
      date_emission: dateEmission,
      date_echeance: dateEcheance || null,
      notes: notes || null,
      mode_paiement: modePaiement || null,
      lignes,
    });

    if (!options?.silent) setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Erreur lors de l'enregistrement.");
      return null;
    }

    setFactureId(result.factureId ?? null);
    return result.factureId ?? null;
  };

  const handleSaveClick = async () => {
    const id = await handleSave();
    if (id) router.push(`/factures/${id}`);
  };

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    setError(null);

    let id = factureId;
    if (!id) {
      id = await handleSave({ silent: true });
      if (!id) {
        setPdfLoading(false);
        return;
      }
    }

    try {
      const result = await fetchAndDownloadFacturePdf(id);
      if (!result.ok) {
        setError(result.error);
        setPdfLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Erreur réseau lors de la génération du PDF.");
    }

    setPdfLoading(false);
  };

  return (
    <div className="space-y-6">
      {(error || numeroError) && (
        <Alert variant="error">{error ?? numeroError}</Alert>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setGenerationOpen(true)}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Génération automatique
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Informations générales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Entreprise <span className="text-red-500">*</span>
            </label>
            <select
              value={entrepriseId}
              onChange={(e) => handleEntrepriseChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {entreprises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              N° facture <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Date d&apos;émission <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateEmission}
                onChange={(e) => setDateEmission(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Date d&apos;échéance
              </label>
              <input
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">Lignes de facturation</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCatalogueOpen(true)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Choisir depuis le catalogue
            </button>
            <button
              type="button"
              onClick={() => setLignes((p) => [...p, emptyLigne(tauxTva)])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              + Ligne libre
            </button>
          </div>
        </div>

        {lignes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-500">
            Aucune ligne. Cliquez sur « Choisir depuis le catalogue » ou « + Ligne libre ».
          </p>
        ) : (
          <div className="space-y-4">
            {lignesAvecTva.map((ligne, index) => {
              const { ht, tva, ttc } = calculerLigne(
                ligne.quantite,
                ligne.prix_unitaire_ht,
                tauxTva
              );
              return (
                <div
                  key={ligne.tempId}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">Ligne {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeLigne(ligne.tempId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-5">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-zinc-500">Désignation</label>
                      <input
                        type="text"
                        value={ligne.designation}
                        onChange={(e) =>
                          updateLigne(ligne.tempId, { designation: e.target.value })
                        }
                        className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Quantité</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={ligne.quantite}
                        onChange={(e) =>
                          updateLigne(ligne.tempId, {
                            quantite: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Prix HT</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ligne.prix_unitaire_ht}
                        onChange={(e) =>
                          updateLigne(ligne.tempId, {
                            prix_unitaire_ht: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex flex-col justify-end text-right text-xs text-zinc-600">
                      <span>HT : {formatMontant(ht)}</span>
                      <span>TVA : {formatMontant(tva)}</span>
                      <span className="font-medium text-zinc-900">TTC : {formatMontant(ttc)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <div className="space-y-1 text-right text-sm">
            <p>
              Total HT : <strong>{formatMontant(totaux.total_ht)}</strong>
            </p>
            <p>
              TVA {tauxTva} % : <strong>{formatMontant(totaux.total_tva)}</strong>
            </p>
            <p className="text-base">
              Total TTC : <strong>{formatMontant(totaux.total_ttc)}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Mode de paiement
          </label>
          <input
            type="text"
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={MODELE_FACTURE.modePaiementDefaut}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Notes (optionnel)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Remarques complémentaires…"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={loading || pdfLoading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Enregistrer la facture"}
        </button>
        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={loading || pdfLoading}
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {pdfLoading ? "Génération…" : "Générer le PDF"}
        </button>
      </div>

      <CataloguePickerModal
        open={catalogueOpen}
        onClose={() => setCatalogueOpen(false)}
        produits={produits}
        onSelect={addFromCatalogue}
      />

      <GenerationFacturesModal
        open={generationOpen}
        onClose={() => setGenerationOpen(false)}
        produits={produits}
        entreprises={entreprises}
      />
    </div>
  );
}
