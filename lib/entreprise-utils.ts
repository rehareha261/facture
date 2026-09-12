import type { Entreprise, EntrepriseFormData } from "@/lib/types";

export function entrepriseToForm(e: Entreprise): EntrepriseFormData {
  return {
    nom: e.nom,
    adresse: e.adresse ?? "",
    nif: e.nif ?? "",
    stat: e.stat ?? "",
    numero_rcs: e.numero_rcs ?? "",
    numero_tva: e.numero_tva ?? "",
    telephone: e.telephone ?? "",
    email: e.email ?? "",
    logo_url: e.logo_url ?? "",
    iban: e.iban ?? "",
  };
}
