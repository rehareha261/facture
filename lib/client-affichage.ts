import type { Client } from "@/lib/types";

/** Lignes d'information client pour affichage (PDF, détail facture) */
export function getClientInfoLines(client: Client): string[] {
  const lines: string[] = [client.nom];

  if (client.adresse?.trim()) lines.push(client.adresse.trim());
  if (client.telephone?.trim()) lines.push(`Tél : ${client.telephone.trim()}`);
  if (client.email?.trim()) lines.push(client.email.trim());

  // NIF / STAT : uniquement si renseignés (clients professionnels)
  const nifStat: string[] = [];
  if (client.nif?.trim()) nifStat.push(`NIF ${client.nif.trim()}`);
  if (client.stat?.trim()) nifStat.push(`STAT ${client.stat.trim()}`);
  if (nifStat.length > 0) lines.push(nifStat.join(" - "));

  return lines;
}
