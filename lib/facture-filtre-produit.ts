import type { FactureAvecLignes } from "@/lib/types";

/** Vérifie si une facture contient le produit (id catalogue ou désignation) */
export function factureContientProduit(
  facture: FactureAvecLignes,
  produitId: string,
  designationProduit: string
): boolean {
  const des = designationProduit.trim().toLowerCase();
  return facture.lignes_facture.some(
    (l) =>
      l.produit_id === produitId ||
      (des.length > 0 && l.designation.trim().toLowerCase() === des)
  );
}
