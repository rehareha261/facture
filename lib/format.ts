import { DEVISE_SYMBOLE } from "./constants";

/** Formate un montant en Ariary malgache */
export function formatMontant(montant: number): string {
  return (
    new Intl.NumberFormat("fr-MG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(montant) + ` ${DEVISE_SYMBOLE}`
  );
}
