"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { CataloguePickerModal } from "@/components/factures/CataloguePickerModal";
import { createFacture } from "@/lib/actions/factures";
import { calculerLigne, calculerTotauxFacture } from "@/lib/facture-calculs";
import { formatMontant } from "@/lib/format";
import type { Client, LigneFactureDraft, Produit } from "@/lib/types";

interface NouvelleFactureFormProps {
  clients: Client[];
  produits: Produit[];
  defaultNumero: string;
  numeroError?: string | null;
}

function newTempId() {
  return `ligne-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyLigne(): LigneFactureDraft {
  return {
    tempId: newTempId(),
    produit_id: null,
    designation: "",
    quantite: 1,
    prix_unitaire_ht: 0,
    taux_tva: 20,
  };
}

export function NouvelleFactureForm({
  clients,
  produits,
  defaultNumero,
  numeroError,
}: NouvelleFactureFormProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [numero, setNumero] = useState(defaultNumero);
  const [dateEmission, setDateEmission] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateEcheance, setDateEcheance] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneFactureDraft[]>([emptyLigne()]);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [factureId, setFactureId] = useState<string | null>(null);

  const clientsFiltres = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telephone?.includes(q)
    );
  }, [clients, clientSearch]);

  const totaux = useMemo(() => calculerTotauxFacture(lignes), [lignes]);

  const updateLigne = (tempId: string, patch: Partial<LigneFactureDraft>) => {
    setLignes((prev) =>
      prev.map((l) => (l.tempId === tempId ? { ...l, ...patch } : l))
    );
  };

  const removeLigne = (tempId: string) => {
    setLignes((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.tempId !== tempId)));
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
        taux_tva: produit.taux_tva,
      },
    ]);
  };

  const handleSave = async (options?: { silent?: boolean }): Promise<string | null> => {
    if (!options?.silent) setLoading(true);
    setError(null);

    const result = await createFacture({
      client_id: clientId,
      numero,
      date_emission: dateEmission,
      date_echeance: dateEcheance || null,
      notes: notes || null,
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
      const res = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factureId: id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Échec de la génération du PDF.");
        setPdfLoading(false);
        return;
      }

      // Télécharger le PDF
      const blob = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);

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

      {/* En-tête facture */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Informations générales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Client <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Rechercher un client…"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="mb-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Sélectionner —</option>
              {clientsFiltres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                  {c.est_professionnel ? " (Pro)" : ""}
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

      {/* Lignes */}
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
              onClick={() => setLignes((p) => [...p, emptyLigne()])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              + Ligne libre
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {lignes.map((ligne, index) => {
            const { ht, tva, ttc } = calculerLigne(
              ligne.quantite,
              ligne.prix_unitaire_ht,
              ligne.taux_tva
            );
            return (
              <div
                key={ligne.tempId}
                className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Ligne {index + 1}</span>
                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLigne(ligne.tempId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-6">
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
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">TVA %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={ligne.taux_tva}
                      onChange={(e) =>
                        updateLigne(ligne.tempId, {
                          taux_tva: parseFloat(e.target.value) || 0,
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

        <div className="mt-6 flex justify-end">
          <div className="space-y-1 text-right text-sm">
            <p>
              Total HT : <strong>{formatMontant(totaux.total_ht)}</strong>
            </p>
            <p>
              Total TVA : <strong>{formatMontant(totaux.total_tva)}</strong>
            </p>
            <p className="text-base">
              Total TTC : <strong>{formatMontant(totaux.total_ttc)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <label className="mb-1 block text-sm font-medium text-zinc-700">Notes (optionnel)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Conditions de paiement, remarques…"
        />
      </div>

      {/* Actions */}
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
    </div>
  );
}
