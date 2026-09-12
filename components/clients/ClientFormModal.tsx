"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { createClient, updateClient } from "@/lib/actions/clients";
import { AuditInfo } from "@/components/admin/AuditInfo";
import type { AuditDisplay, Client, ClientFormData } from "@/lib/types";

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
  audit?: AuditDisplay;
  showAudit?: boolean;
}

const emptyForm: ClientFormData = {
  nom: "",
  adresse: "",
  email: "",
  telephone: "",
  est_professionnel: false,
  nif: "",
  stat: "",
};

function clientToForm(client: Client): ClientFormData {
  return {
    nom: client.nom,
    adresse: client.adresse ?? "",
    email: client.email ?? "",
    telephone: client.telephone ?? "",
    est_professionnel: client.est_professionnel,
    nif: client.nif ?? "",
    stat: client.stat ?? "",
  };
}

function ClientFormBody({
  client,
  onClose,
  audit,
  showAudit,
}: {
  client?: Client | null;
  onClose: () => void;
  audit?: AuditDisplay;
  showAudit?: boolean;
}) {
  const router = useRouter();
  const isEditing = !!client;
  const [form, setForm] = useState<ClientFormData>(
    () => (client ? clientToForm(client) : emptyForm)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = <K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = isEditing
      ? await updateClient(client!.id, form)
      : await createClient(form);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Une erreur est survenue.");
      return;
    }

    onClose();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <label htmlFor="nom" className="mb-1 block text-sm font-medium text-zinc-700">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          id="nom"
          type="text"
          required
          value={form.nom}
          onChange={(e) => updateField("nom", e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          onChange={(e) => updateField("adresse", e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="telephone" className="mb-1 block text-sm font-medium text-zinc-700">
            Téléphone
          </label>
          <input
            id="telephone"
            type="tel"
            value={form.telephone}
            onChange={(e) => updateField("telephone", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="est_professionnel"
          type="checkbox"
          checked={form.est_professionnel}
          onChange={(e) => updateField("est_professionnel", e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="est_professionnel" className="text-sm font-medium text-zinc-700">
          Client professionnel
        </label>
      </div>

      {form.est_professionnel && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nif" className="mb-1 block text-sm font-medium text-zinc-700">
              NIF
            </label>
            <input
              id="nif"
              type="text"
              value={form.nif}
              onChange={(e) => updateField("nif", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              onChange={(e) => updateField("stat", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="col-span-full text-xs text-zinc-500">
            Renseignez au moins le NIF ou le STAT pour un client professionnel.
          </p>
        </div>
      )}

      {showAudit && audit && <AuditInfo audit={audit} />}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : isEditing ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </form>
  );
}

export function ClientFormModal({
  open,
  onClose,
  client,
  audit,
  showAudit,
}: ClientFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? "Modifier le client" : "Nouveau client"}
    >
      {open && (
        <ClientFormBody
          key={client?.id ?? "new"}
          client={client}
          onClose={onClose}
          audit={audit}
          showAudit={showAudit}
        />
      )}
    </Modal>
  );
}
