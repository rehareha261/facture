import { getEntreprise } from "@/lib/actions/entreprise";

/** Taux TVA par défaut si non configuré */
export const TAUX_TVA_DEFAUT = 20;

/** Récupère le taux TVA global configuré sur l'entreprise */
export async function getTauxTvaGlobal(): Promise<number> {
  const { data } = await getEntreprise();
  const taux = data?.taux_tva;
  if (taux === null || taux === undefined) return TAUX_TVA_DEFAUT;
  return taux;
}
