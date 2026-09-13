"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { createProduit, updateProduit } from "@/lib/actions/produits";
import type { Produit, ProduitFormData } from "@/lib/types";

interface ProduitFormModalProps {
  open: boolean;
  onClose: () => void;
  produit?: Produit | null;
  entrepriseId: string;
}

const emptyForm: ProduitFormData = {
  designation: "",
  prix_unitaire_ht: 0,
};

function ProduitFormBody({
  produit,
  entrepriseId,
  onClose,
}: {
  produit?: Produit | null;
  entrepriseId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!produit;
  const [form, setForm] = useState<ProduitFormData>(() =>
    produit
      ? { designation: produit.designation, prix_unitaire_ht: produit.prix_unitaire_ht }
      : emptyForm
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = isEditing
      ? await updateProduit(produit!.id, form)
      : await createProduit(entrepriseId, form);

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
        <label htmlFor="designation" className="mb-1 block text-sm font-medium text-zinc-700">
          Désignation <span className="text-red-500">*</span>
        </label>
        <input
          id="designation"
          type="text"
          required
          value={form.designation}
          onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="prix" className="mb-1 block text-sm font-medium text-zinc-700">
          Prix unitaire HT <span className="text-red-500">*</span>
        </label>
        <input
          id="prix"
          type="number"
          min="0"
          step="0.01"
          required
          value={form.prix_unitaire_ht}
          onChange={(e) =>
            setForm((p) => ({ ...p, prix_unitaire_ht: parseFloat(e.target.value) || 0 }))
          }
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>


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

export function ProduitFormModal({
  open,
  onClose,
  produit,
  entrepriseId,
}: ProduitFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={produit ? "Modifier le produit" : "Nouveau produit"}
    >
      {open && (
        <ProduitFormBody
          key={produit?.id ?? `${entrepriseId}-new`}
          produit={produit}
          entrepriseId={entrepriseId}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
