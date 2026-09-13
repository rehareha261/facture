import { arrondirMontant } from "@/lib/facture-calculs";
import { VENTES_MENSUELLES_HT } from "@/lib/seed-ventes-mensuelles";

const MOIS_SPECIAL_2023_02 = 637_797.1;

export interface ProduitRef {
  id: string;
  designation: string;
  prix_unitaire_ht: number;
}

export const CONSIGNATION_DESIGNATION = "Consignation";

export interface LigneGeneree {
  produit_id: string | null;
  designation: string;
  quantite: number;
  prix_unitaire_ht: number;
}

export interface FactureGeneree {
  annee: number;
  mois: number;
  jour: number;
  numero: string;
  date_emission: string;
  lignes: LigneGeneree[];
  total_ht: number;
}

function toCents(v: number): number {
  return Math.round(v * 100);
}

function fromCents(c: number): number {
  return arrondirMontant(c / 100);
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const rng = seededRandom(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function joursDansMois(annee: number, mois: number): number {
  return new Date(annee, mois, 0).getDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dateIso(annee: number, mois: number, jour: number): string {
  return `${annee}-${pad2(mois)}-${pad2(jour)}`;
}

export function repartirMontantParJours(
  montant: number,
  annee: number,
  mois: number
): { jour: number; montant: number }[] {
  if (annee === 2023 && mois === 2 && Math.abs(montant - MOIS_SPECIAL_2023_02) < 0.01) {
    return [{ jour: 15, montant: MOIS_SPECIAL_2023_02 }];
  }

  const rng = seededRandom(annee * 100 + mois);
  const maxJour = joursDansMois(annee, mois);
  const nbFactures = Math.min(maxJour, Math.max(4, Math.floor(4 + rng() * 11)));

  const joursDisponibles = Array.from({ length: maxJour }, (_, i) => i + 1);
  const joursChoisis: number[] = [];
  for (let i = 0; i < nbFactures; i++) {
    const idx = Math.floor(rng() * joursDisponibles.length);
    joursChoisis.push(joursDisponibles.splice(idx, 1)[0]!);
  }
  joursChoisis.sort((a, b) => a - b);

  const poids = joursChoisis.map(() => 0.4 + rng() * 0.6);
  const sommePoids = poids.reduce((s, p) => s + p, 0);

  const montants: number[] = [];
  let reste = montant;
  for (let i = 0; i < joursChoisis.length; i++) {
    if (i === joursChoisis.length - 1) {
      montants.push(arrondirMontant(reste));
    } else {
      const part = arrondirMontant((montant * poids[i]!) / sommePoids);
      montants.push(part);
      reste = arrondirMontant(reste - part);
    }
  }

  return joursChoisis.map((jour, i) => ({ jour, montant: montants[i]! }));
}

function mergeLigne(map: Map<string, LigneGeneree>, ligne: LigneGeneree) {
  const key = ligne.produit_id
    ? `${ligne.produit_id}:${ligne.prix_unitaire_ht}`
    : `${ligne.designation}:${ligne.prix_unitaire_ht}`;
  const existing = map.get(key);
  if (existing) existing.quantite += ligne.quantite;
  else map.set(key, { ...ligne });
}

function ajouterConsignation(map: Map<string, LigneGeneree>, montantHt: number) {
  const montant = arrondirMontant(montantHt);
  if (montant <= 0) return;
  mergeLigne(map, {
    produit_id: null,
    designation: CONSIGNATION_DESIGNATION,
    quantite: 1,
    prix_unitaire_ht: montant,
  });
}

export function composerLignesPourMontant(
  montant: number,
  produits: ProduitRef[],
  seed: number
): LigneGeneree[] {
  if (montant <= 0 || produits.length === 0) return [];

  if (Math.abs(montant - MOIS_SPECIAL_2023_02) < 0.01) {
    return [
      {
        produit_id: null,
        designation: CONSIGNATION_DESIGNATION,
        quantite: 1,
        prix_unitaire_ht: MOIS_SPECIAL_2023_02,
      },
    ];
  }

  const rng = seededRandom(seed);
  const ordre = shuffleWithSeed(produits, seed);

  let reste = toCents(montant);
  const map = new Map<string, LigneGeneree>();
  let safety = 0;

  while (reste > 0 && safety++ < 10_000) {
    const candidats = ordre.filter((p) => toCents(p.prix_unitaire_ht) <= reste);
    if (candidats.length === 0) break;

    const p = candidats[Math.floor(rng() * candidats.length)]!;
    const prixCents = toCents(p.prix_unitaire_ht);
    const maxQty = Math.floor(reste / prixCents);
    const qty =
      maxQty === 1
        ? 1
        : Math.max(1, Math.min(maxQty, Math.floor(1 + rng() * Math.min(maxQty, 25))));

    mergeLigne(map, {
      produit_id: p.id,
      designation: p.designation,
      quantite: qty,
      prix_unitaire_ht: p.prix_unitaire_ht,
    });
    reste -= qty * prixCents;
  }

  if (reste > 0) {
    const cheap = [...ordre].sort(
      (a, b) => toCents(a.prix_unitaire_ht) - toCents(b.prix_unitaire_ht)
    )[0]!;
    const prixCents = toCents(cheap.prix_unitaire_ht);
    const qty = Math.floor(reste / prixCents);
    if (qty > 0) {
      mergeLigne(map, {
        produit_id: cheap.id,
        designation: cheap.designation,
        quantite: qty,
        prix_unitaire_ht: cheap.prix_unitaire_ht,
      });
      reste -= qty * prixCents;
    }
    if (reste > 0) {
      ajouterConsignation(map, fromCents(reste));
    }
  }

  return Array.from(map.values());
}

function totalHtLignes(lignes: LigneGeneree[]): number {
  return arrondirMontant(lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire_ht, 0));
}

export function genererFacturesMois(
  annee: number,
  mois: number,
  montantCible: number,
  produits: ProduitRef[]
): FactureGeneree[] {
  const repartitions = repartirMontantParJours(montantCible, annee, mois);

  const factures = repartitions.map((part, index) => {
    const seed = annee * 10_000 + mois * 100 + part.jour + index;
    const lignes = composerLignesPourMontant(part.montant, produits, seed);
    return {
      annee,
      mois,
      jour: part.jour,
      numero: `SEED-VENTES-${annee}-${pad2(mois)}-${pad2(index + 1)}`,
      date_emission: dateIso(annee, mois, part.jour),
      lignes,
      total_ht: totalHtLignes(lignes),
    };
  });

  return ajusterEcartMensuel(factures, montantCible);
}

/** Si un écart subsiste sur le mois, complète la dernière facture avec Consignation */
function ajusterEcartMensuel(
  factures: FactureGeneree[],
  montantCible: number
): FactureGeneree[] {
  const { ecart, ok } = verifierTotalMois(factures, montantCible);
  if (ok || factures.length === 0 || ecart <= 0) return factures;

  const result = factures.map((f) => ({ ...f, lignes: [...f.lignes] }));
  const last = result[result.length - 1]!;
  last.lignes.push({
    produit_id: null,
    designation: CONSIGNATION_DESIGNATION,
    quantite: 1,
    prix_unitaire_ht: ecart,
  });
  last.total_ht = totalHtLignes(last.lignes);
  return result;
}

export function verifierTotalMois(
  factures: FactureGeneree[],
  montantCible: number
): { obtenu: number; ecart: number; ok: boolean } {
  const obtenu = arrondirMontant(factures.reduce((s, f) => s + f.total_ht, 0));
  const ecart = arrondirMontant(obtenu - montantCible);
  return { obtenu, ecart, ok: Math.abs(ecart) < 0.02 };
}

export function genererToutesLesFacturesSeed(produits: ProduitRef[]): FactureGeneree[] {
  const factures: FactureGeneree[] = [];

  for (const [anneeStr, montants] of Object.entries(VENTES_MENSUELLES_HT)) {
    const annee = Number(anneeStr);
    montants.forEach((montant, moisIndex) => {
      const mois = moisIndex + 1;
      factures.push(...genererFacturesMois(annee, mois, montant, produits));
    });
  }

  return factures;
}

export function verifierTotauxMensuelsSeed(
  factures: FactureGeneree[]
): { annee: number; mois: number; cible: number; obtenu: number; ok: boolean }[] {
  const resultats: { annee: number; mois: number; cible: number; obtenu: number; ok: boolean }[] =
    [];

  for (const [anneeStr, montants] of Object.entries(VENTES_MENSUELLES_HT)) {
    const annee = Number(anneeStr);
    montants.forEach((cible, moisIndex) => {
      const mois = moisIndex + 1;
      const duMois = factures.filter((f) => f.annee === annee && f.mois === mois);
      const { obtenu, ok } = verifierTotalMois(duMois, cible);
      resultats.push({ annee, mois, cible, obtenu, ok });
    });
  }

  return resultats;
}
