"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { ImportProduitsModal } from "@/components/produits/ImportProduitsModal";
import { ProduitFormModal } from "@/components/produits/ProduitFormModal";
import { deleteProduit } from "@/lib/actions/produits";
import { filtrerProduits } from "@/lib/filtre-produits";
import { formatMontant } from "@/lib/format";
import type { Produit } from "@/lib/types";

interface ProduitsManagerProps {
  produits: Produit[];
}

export function ProduitsManager({ produits }: ProduitsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const produitsFiltres = useMemo(
    () => filtrerProduits(produits, search),
    [produits, search]
  );

  const handleDelete = async (produit: Produit) => {
    const confirmed = window.confirm(
      `Supprimer « ${produit.designation} » ?\n\nLes factures existantes ne seront pas affectées.\nEn cas d'erreur, contactez l'administrateur pour le restaurer.`
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {produitsFiltres.length} / {produits.length} produit{produits.length !== 1 ? "s" : ""}
        </p>
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

      {produits.length > 0 && (
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

      {produits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center">
          <p className="text-zinc-500">Aucun produit dans le catalogue.</p>
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
      />

      <ImportProduitsModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
