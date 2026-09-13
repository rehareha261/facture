import type { Entreprise, EntrepriseFormData } from "@/lib/types";

export function entrepriseNifStat(e: Pick<Entreprise, "nif" | "stat">): string {
  const parts: string[] = [];
  if (e.nif?.trim()) parts.push(`NIF ${e.nif.trim()}`);
  if (e.stat?.trim()) parts.push(`STAT ${e.stat.trim()}`);
  return parts.join(" - ");
}

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
