import { MOIS_LABELS } from "@/lib/dashboard-ventes";

export interface LigneVenteDashboard {
  quantite: number;
  produit_id: string | null;
  designation: string;
  date_emission: string;
}

export interface QuantitesMensuellesData {
  labels: string[];
  quantites: number[];
  annee: number;
  produitLabel: string;
}

export interface ProduitVendu {
  produit_id: string | null;
  designation: string;
  quantite: number;
}

export function produitsDisponibles(
  lignes: LigneVenteDashboard[]
): { id: string; designation: string }[] {
  const map = new Map<string, string>();
  for (const l of lignes) {
    const id = l.produit_id ?? `custom:${l.designation}`;
    if (!map.has(id)) map.set(id, l.designation);
  }
  return Array.from(map.entries())
    .map(([id, designation]) => ({ id, designation }))
    .sort((a, b) => a.designation.localeCompare(b.designation, "fr"));
}

export function aggregerQuantitesMensuelles(
  lignes: LigneVenteDashboard[],
  annee: number,
  produitId?: string
): QuantitesMensuellesData {
  const quantites = Array(12).fill(0);
  let produitLabel = "Tous les produits";

  for (const ligne of lignes) {
    const d = new Date(ligne.date_emission);
    if (d.getFullYear() !== annee) continue;

    const id = ligne.produit_id ?? `custom:${ligne.designation}`;
    if (produitId && id !== produitId) continue;

    if (produitId) produitLabel = ligne.designation;
    quantites[d.getMonth()] += Number(ligne.quantite) || 0;
  }

  return {
    labels: [...MOIS_LABELS],
    quantites,
    annee,
    produitLabel,
  };
}

export function produitPlusVendu(
  lignes: LigneVenteDashboard[],
  annee: number
): ProduitVendu | null {
  const totals = new Map<string, ProduitVendu>();

  for (const ligne of lignes) {
    const d = new Date(ligne.date_emission);
    if (d.getFullYear() !== annee) continue;

    const id = ligne.produit_id ?? `custom:${ligne.designation}`;
    const existing = totals.get(id);
    const qty = Number(ligne.quantite) || 0;

    if (existing) {
      existing.quantite += qty;
    } else {
      totals.set(id, {
        produit_id: ligne.produit_id,
        designation: ligne.designation,
        quantite: qty,
      });
    }
  }

  let best: ProduitVendu | null = null;
  for (const entry of totals.values()) {
    if (!best || entry.quantite > best.quantite) best = entry;
  }
  return best;
}
