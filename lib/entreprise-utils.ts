import type { Entreprise, EntrepriseFormData } from "@/lib/types";

export function entrepriseToForm(e: Entreprise): EntrepriseFormData {
  return {
    nom: e.nom,
    adresse: e.adresse ?? "",
    nif: e.nif ?? "",
    stat: e.stat ?? "",
    activite: e.activite ?? "",
    taux_tva: e.taux_tva ?? 20,
  };
}
