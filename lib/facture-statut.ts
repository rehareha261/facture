import type { Facture, StatutFacture } from "@/lib/types";

/** Libellés français des statuts */
export const STATUT_LABELS: Record<StatutFacture, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  payee: "Payée",
  en_retard: "En retard",
  annulee: "Annulée",
};

/** Variante de badge par statut */
export const STATUT_BADGE_VARIANT: Record<
  StatutFacture,
  "default" | "pro" | "success" | "warning" | "danger"
> = {
  brouillon: "default",
  envoyee: "pro",
  payee: "success",
  en_retard: "danger",
  annulee: "warning",
};

/**
 * Statut effectif à l'affichage : une facture « envoyée » dont l'échéance est
 * dépassée apparaît comme « en retard » (sans modifier la base).
 */
export function getStatutEffectif(facture: Pick<Facture, "statut" | "date_echeance">): StatutFacture {
  if (
    facture.statut === "envoyee" &&
    facture.date_echeance &&
    !["payee", "annulee"].includes(facture.statut)
  ) {
    const echeance = new Date(facture.date_echeance);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    echeance.setHours(0, 0, 0, 0);
    if (echeance < aujourdhui) {
      return "en_retard";
    }
  }
  return facture.statut;
}

/** Statuts disponibles dans le menu de changement */
export const STATUTS_MODIFIABLES: StatutFacture[] = [
  "brouillon",
  "envoyee",
  "payee",
  "en_retard",
  "annulee",
];
