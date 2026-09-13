import { DEVISE_SYMBOLE } from "./constants";

/**
 * Formate un nombre avec le point comme séparateur de milliers.
 * Ex. 50000 → "50.000" | 1234.5 → "1.234,5"
 */
export function formatNombre(montant: number): string {
  const arrondi = Math.round(montant * 100) / 100;
  const [partieEntiere, partieDecimale] = arrondi.toFixed(2).split(".");
  const avecPoints = partieEntiere.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = parseInt(partieDecimale, 10);
  if (dec === 0) return avecPoints;
  const decTrim = partieDecimale.replace(/0+$/, "");
  return `${avecPoints},${decTrim}`;
}

/** Formate un montant en Ariary malgache */
export function formatMontant(montant: number): string {
  return `${formatNombre(montant)} ${DEVISE_SYMBOLE}`;
}

/** PDF : toujours 2 décimales max, affichées avec virgule */
export function formatNombrePdf(montant: number): string {
  const arrondi = Math.round(montant * 100) / 100;
  const [partieEntiere, partieDecimale] = arrondi.toFixed(2).split(".");
  const avecPoints = partieEntiere.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${avecPoints},${partieDecimale}`;
}

/** PDF : quantité entière ou max 2 décimales */
export function formatQuantitePdf(quantite: number): string {
  const arrondi = Math.round(quantite * 100) / 100;
  if (Number.isInteger(arrondi)) return String(arrondi);
  return arrondi.toFixed(2).replace(".", ",");
}
