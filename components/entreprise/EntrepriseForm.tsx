"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { saveEntreprise } from "@/lib/actions/entreprise";
import { entrepriseToForm } from "@/lib/entreprise-utils";
import type { Entreprise, EntrepriseFormData } from "@/lib/types";

const emptyForm: EntrepriseFormData = {
  nom: "",
  adresse: "",
  nif: "",
  stat: "",
  numero_rcs: "",
  numero_tva: "",
  telephone: "",
  email: "",
  logo_url: "",
  iban: "",
};

interface EntrepriseFormProps {
  entreprise: Entreprise | null;
}

export function EntrepriseForm({ entreprise }: EntrepriseFormProps) {
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
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Informations enregistrées avec succès.</Alert>}

      {/* Identité */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Identité
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="nom" className="mb-1 block text-sm font-medium text-zinc-700">
              Nom de l&apos;entreprise <span className="text-red-500">*</span>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="telephone" className="mb-1 block text-sm font-medium text-zinc-700">
                Téléphone
              </label>
              <input
                id="telephone"
                type="tel"
                value={form.telephone}
                onChange={(e) => update("telephone", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="logo_url" className="mb-1 block text-sm font-medium text-zinc-700">
              URL du logo
            </label>
            <input
              id="logo_url"
              type="url"
              placeholder="https://..."
              value={form.logo_url}
              onChange={(e) => update("logo_url", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Affiché en haut des factures PDF. Uploadez votre logo dans Supabase Storage et
              collez l&apos;URL publique ici.
            </p>
            {form.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logo_url}
                alt="Aperçu logo"
                className="mt-3 h-16 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Informations légales — toujours affichées sur le PDF si renseignées */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Informations légales
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Le NIF et le STAT de l&apos;entreprise apparaissent toujours sur les factures PDF s&apos;ils
          sont renseignés.
        </p>
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
          <div>
            <label htmlFor="numero_rcs" className="mb-1 block text-sm font-medium text-zinc-700">
              N° RCS
            </label>
            <input
              id="numero_rcs"
              type="text"
              value={form.numero_rcs}
              onChange={(e) => update("numero_rcs", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="numero_tva" className="mb-1 block text-sm font-medium text-zinc-700">
              N° TVA
            </label>
            <input
              id="numero_tva"
              type="text"
              value={form.numero_tva}
              onChange={(e) => update("numero_tva", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Paiement */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Paiement
        </h2>
        <div>
          <label htmlFor="iban" className="mb-1 block text-sm font-medium text-zinc-700">
            IBAN
          </label>
          <input
            id="iban"
            type="text"
            value={form.iban}
            onChange={(e) => update("iban", e.target.value)}
            className={inputClass}
            placeholder="MG..."
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
