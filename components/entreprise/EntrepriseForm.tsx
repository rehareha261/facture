"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { saveEntreprise } from "@/lib/actions/entreprise";
import { entrepriseToForm } from "@/lib/entreprise-utils";
import { TAUX_TVA_DEFAUT } from "@/lib/constants";
import type { Entreprise, EntrepriseFormData } from "@/lib/types";

const emptyForm: EntrepriseFormData = {
  nom: "",
  adresse: "",
  nif: "",
  stat: "",
  activite: "",
  taux_tva: TAUX_TVA_DEFAUT,
};

interface EntrepriseFormProps {
  entreprise: Entreprise | null;
  onSaved?: () => void;
}

export function EntrepriseForm({ entreprise, onSaved }: EntrepriseFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<EntrepriseFormData>(
    entreprise ? entrepriseToForm(entreprise) : emptyForm
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof EntrepriseFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await saveEntreprise(form, entreprise?.id);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Erreur lors de l'enregistrement.");
      return;
    }

    setSuccess(true);
    router.refresh();
    onSaved?.();
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Informations enregistrées avec succès.</Alert>}

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Identité
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="nom" className="mb-1 block text-sm font-medium text-zinc-700">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="nom"
              type="text"
              required
              value={form.nom}
              onChange={(e) => update("nom", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="adresse" className="mb-1 block text-sm font-medium text-zinc-700">
              Adresse
            </label>
            <textarea
              id="adresse"
              rows={2}
              value={form.adresse}
              onChange={(e) => update("adresse", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="activite" className="mb-1 block text-sm font-medium text-zinc-700">
              Activité
            </label>
            <input
              id="activite"
              type="text"
              value={form.activite}
              onChange={(e) => update("activite", e.target.value)}
              className={inputClass}
              placeholder="Ex. Vente en gros de boissons alcooliques"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nif" className="mb-1 block text-sm font-medium text-zinc-700">
                NIF
              </label>
              <input
                id="nif"
                type="text"
                value={form.nif}
                onChange={(e) => update("nif", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="stat" className="mb-1 block text-sm font-medium text-zinc-700">
                STAT
              </label>
              <input
                id="stat"
                type="text"
                value={form.stat}
                onChange={(e) => update("stat", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">TVA</h2>
        <div>
          <label htmlFor="taux_tva" className="mb-1 block text-sm font-medium text-zinc-700">
            Taux de TVA (%) <span className="text-red-500">*</span>
          </label>
          <input
            id="taux_tva"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            value={form.taux_tva}
            onChange={(e) =>
              setForm((p) => ({ ...p, taux_tva: parseFloat(e.target.value) || 0 }))
            }
            className={inputClass}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : entreprise ? "Mettre à jour" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
