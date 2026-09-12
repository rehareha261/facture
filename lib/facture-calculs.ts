import type { LigneFactureDraft } from "@/lib/types";

export interface TotauxLigne {
  ht: number;
  tva: number;
  ttc: number;
}

export interface TotauxFacture {
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

/** Calcule HT, TVA et TTC pour une ligne */
export function calculerLigne(
  quantite: number,
  prixUnitaireHt: number,
  tauxTva: number
): TotauxLigne {
  const ht = quantite * prixUnitaireHt;
  const tva = ht * (tauxTva / 100);
  return { ht, tva, ttc: ht + tva };
}

/** Calcule les totaux globaux à partir des lignes de saisie */
export function calculerTotauxFacture(lignes: LigneFactureDraft[]): TotauxFacture {
  return lignes.reduce(
    (acc, ligne) => {
      const { ht, tva, ttc } = calculerLigne(
        ligne.quantite,
        ligne.prix_unitaire_ht,
        ligne.taux_tva
      );
      return {
        total_ht: acc.total_ht + ht,
        total_tva: acc.total_tva + tva,
        total_ttc: acc.total_ttc + ttc,
      };
    },
    { total_ht: 0, total_tva: 0, total_ttc: 0 }
  );
}

/** Arrondit à 2 décimales pour éviter les erreurs de virgule flottante */
export function arrondirMontant(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}
