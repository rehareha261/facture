"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { ImportProduitsModal } from "@/components/produits/ImportProduitsModal";
import { ProduitFormModal } from "@/components/produits/ProduitFormModal";
import { deleteProduit } from "@/lib/actions/produits";
import { filtrerProduits } from "@/lib/filtre-produits";
import { formatMontant } from "@/lib/format";
import type { Entreprise, Produit } from "@/lib/types";

interface ProduitsManagerProps {
  entreprises: Entreprise[];
  produits: Produit[];
  defaultEntrepriseId: string;
}

export function ProduitsManager({
  entreprises,
  produits,
  defaultEntrepriseId,
}: ProduitsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entrepriseId, setEntrepriseId] = useState(defaultEntrepriseId);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const entrepriseSelectionnee = useMemo(
    () => entreprises.find((e) => e.id === entrepriseId) ?? entreprises[0]!,
    [entreprises, entrepriseId]
  );

  const produitsEntreprise = useMemo(
    () => produits.filter((p) => p.entreprise_id === entrepriseId),
    [produits, entrepriseId]
  );

  const produitsFiltres = useMemo(
    () => filtrerProduits(produitsEntreprise, search),
    [produitsEntreprise, search]
  );

  const handleEntrepriseChange = (id: string) => {
    setEntrepriseId(id);
    setSearch("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("entreprise", id);
    router.replace(`/produits?${params.toString()}`);
  };

  const handleDelete = async (produit: Produit) => {
    const confirmed = window.confirm(
      `Supprimer « ${produit.designation} » ? Les factures existantes ne seront pas affectées.`
    );
    if (!confirmed) return;

    setDeletingId(produit.id);
    setDeleteError(null);
    const result = await deleteProduit(produit.id);
    setDeletingId(null);

    if (!result.success) {
      setDeleteError(result.error ?? "Impossible de supprimer ce produit.");
      return;
    }
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[200px] flex-1 sm:max-w-xs">
          <label className="mb-1 block text-sm font-medium text-zinc-700">Entreprise</label>
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Importer CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduit(null);
              setFormOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nouveau produit
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        Catalogue de <span className="font-medium text-zinc-700">{entrepriseSelectionnee.nom}</span>
        {" — "}
        {produitsFiltres.length} / {produitsEntreprise.length} produit
        {produitsEntreprise.length !== 1 ? "s" : ""}
      </p>

      {produitsEntreprise.length > 0 && (
        <input
          type="search"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-md"
        />
      )}

      {deleteError && (
        <div className="mb-4">
          <Alert variant="error">{deleteError}</Alert>
        </div>
      )}

      {produitsEntreprise.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center">
          <p className="text-zinc-500">
            Aucun produit pour cette entreprise. Créez-en un ou importez un CSV.
          </p>
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center">
          <p className="text-zinc-500">Aucun produit ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Désignation
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Prix HT
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {produitsFiltres.map((produit) => (
                <tr key={produit.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                    {produit.designation}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-zinc-600">
                    {formatMontant(produit.prix_unitaire_ht)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduit(produit);
                        setFormOpen(true);
                      }}
                      className="mr-2 font-medium text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(produit)}
                      disabled={deletingId === produit.id}
                      className="font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === produit.id ? "Suppression…" : "Supprimer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProduitFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProduit(null);
        }}
        produit={editingProduit}
        entrepriseId={entrepriseId}
      />

      <ImportProduitsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entrepriseId={entrepriseId}
        entrepriseNom={entrepriseSelectionnee.nom}
      />
    </>
  );
}
