import { getEntrepriseById, getEntreprises } from "@/lib/actions/entreprise";
import { TAUX_TVA_DEFAUT } from "@/lib/constants";

export { TAUX_TVA_DEFAUT };

/** Récupère le taux TVA d'une entreprise */
export async function getTauxTvaEntreprise(entrepriseId: string): Promise<number> {
  const { data } = await getEntrepriseById(entrepriseId);
  const taux = data?.taux_tva;
  if (taux === null || taux === undefined) return TAUX_TVA_DEFAUT;
  return taux;
}

/** Taux TVA par défaut (première entreprise) — catalogue produits */
export async function getTauxTvaGlobal(): Promise<number> {
  const { data } = await getEntreprises();
  return data[0]?.taux_tva ?? TAUX_TVA_DEFAUT;
}
