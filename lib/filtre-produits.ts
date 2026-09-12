import type { Produit } from "@/lib/types";

/** Filtre les produits par désignation (insensible à la casse) */
export function filtrerProduits(produits: Produit[], query: string): Produit[] {
  const q = query.trim().toLowerCase();
  if (!q) return produits;
  return produits.filter((p) => p.designation.toLowerCase().includes(q));
}
