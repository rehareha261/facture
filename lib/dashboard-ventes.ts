import type { Facture } from "@/lib/types";

export const MOIS_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
] as const;

/** Libellés mois pour export Excel (modèle Odette) */
export const MOIS_LABELS_EXCEL = [
  "JANVIER",
  "FEVRIER",
  "MARS",
  "AVRIL",
  "MAI",
  "JUIN",
  "JUILLET",
  "AOÛT",
  "SEPTEMBRE",
  "OCTOBRE",
  "NOVEMBRE",
  "DÉCEMBRE",
] as const;

export interface VentesMensuellesChartData {
  labels: string[];
  annees: [number, number, number];
  series: { annee: number; montants: number[] }[];
}

/** Années n, n-1, n-2 à partir de l'année de référence */
export function anneesComparaison(anneeReference: number): [number, number, number] {
  return [anneeReference, anneeReference - 1, anneeReference - 2];
}

/** Agrège le total HT des factures par mois sur 3 ans (n, n-1, n-2) */
export function aggregerVentesMensuelles(
  factures: Facture[],
  anneeReference: number
): VentesMensuellesChartData {
  const annees = anneesComparaison(anneeReference);
  const anneeSet = new Set<number>(annees);
  const montantsParAnnee = new Map<number, number[]>(
    annees.map((a) => [a, Array(12).fill(0)])
  );

  for (const facture of factures) {
    const d = new Date(facture.date_emission);
    const annee = d.getFullYear();
    const mois = d.getMonth();

    if (!anneeSet.has(annee)) continue;

    const row = montantsParAnnee.get(annee)!;
    row[mois] += Number(facture.total_ht) || 0;
  }

  return {
    labels: [...MOIS_LABELS],
    annees,
    series: annees.map((annee) => ({
      annee,
      montants: montantsParAnnee.get(annee)!,
    })),
  };
}

/** Années disponibles pour le sélecteur (min–max des factures + année courante) */
export function anneesDisponibles(factures: Facture[]): number[] {
  const now = new Date().getFullYear();
  let min = now;
  let max = now;

  for (const f of factures) {
    const y = new Date(f.date_emission).getFullYear();
    if (y < min) min = y;
    if (y > max) max = y;
  }

  const list: number[] = [];
  for (let y = max; y >= min; y--) list.push(y);
  if (list.length === 0) list.push(now);
  return list;
}
