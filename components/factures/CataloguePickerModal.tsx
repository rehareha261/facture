"use client";

import { Modal } from "@/components/ui/Modal";
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
  return (
    <Modal open={open} onClose={onClose} title="Choisir depuis le catalogue">
      {produits.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun produit dans le catalogue.{" "}
          <a href="/produits" className="text-blue-600 hover:underline">
            Ajouter un produit
          </a>
        </p>
      ) : (
        <ul className="max-h-80 divide-y divide-zinc-200 overflow-y-auto">
          {produits.map((produit) => (
            <li key={produit.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(produit);
                  onClose();
                }}
                className="flex w-full items-center justify-between px-2 py-3 text-left hover:bg-zinc-50"
              >
                <span className="text-sm font-medium text-zinc-900">{produit.designation}</span>
                <span className="text-sm text-zinc-500">
                  {formatMontant(produit.prix_unitaire_ht)} — TVA {produit.taux_tva} %
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
