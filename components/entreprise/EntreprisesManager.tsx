"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { EntrepriseFormModal } from "@/components/entreprise/EntrepriseFormModal";
import { deleteEntreprise } from "@/lib/actions/entreprise";
import type { Entreprise } from "@/lib/types";

interface EntreprisesManagerProps {
  entreprises: Entreprise[];
}

export function EntreprisesManager({ entreprises }: EntreprisesManagerProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Entreprise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (entreprise: Entreprise) => {
    setEditing(entreprise);
    setFormOpen(true);
  };

  const handleDelete = async (entreprise: Entreprise) => {
    if (!window.confirm(`Supprimer « ${entreprise.nom} » ?`)) return;
    setDeletingId(entreprise.id);
    setError(null);
    const result = await deleteEntreprise(entreprise.id);
    setDeletingId(null);
    if (!result.success) {
      setError(result.error ?? "Suppression impossible.");
      return;
    }
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nouvelle entreprise
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {entreprises.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-zinc-500">
          Aucune entreprise. Créez-en une pour émettre des factures.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">NIF</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">TVA</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {entreprises.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{e.nom}</td>
                  <td className="px-4 py-3 text-zinc-600">{e.nif ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{e.taux_tva} %</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e)}
                      disabled={deletingId === e.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EntrepriseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        entreprise={editing}
      />
    </>
  );
}
