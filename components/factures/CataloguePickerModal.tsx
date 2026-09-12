"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { filtrerProduits } from "@/lib/filtre-produits";
import { formatMontant } from "@/lib/format";
import type { Produit } from "@/lib/types";

interface CataloguePickerModalProps {
  open: boolean;
  onClose: () => void;
  produits: Produit[];
  onSelect: (produit: Produit) => void;
}

export function CataloguePickerModal({
  open,
  onClose,
  produits,
  onSelect,
}: CataloguePickerModalProps) {
  const [search, setSearch] = useState("");

  const produitsFiltres = useMemo(
    () => filtrerProduits(produits, search),
    [produits, search]
  );

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Choisir depuis le catalogue" wide>
      {produits.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun produit dans le catalogue.{" "}
          <a href="/produits" className="text-blue-600 hover:underline">
            Ajouter un produit
          </a>
        </p>
      ) : (
        <>
          <input
            type="search"
            autoFocus
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mb-2 text-xs text-zinc-500">
            {produitsFiltres.length} / {produits.length} produits
          </p>
          {produitsFiltres.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">Aucun produit trouvé.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200">
              {produitsFiltres.map((produit) => (
                <li key={produit.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(produit);
                      setSearch("");
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-zinc-50"
                  >
                    <span className="text-sm font-medium text-zinc-900">{produit.designation}</span>
                    <span className="shrink-0 text-sm text-zinc-500">
                      {formatMontant(produit.prix_unitaire_ht)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
