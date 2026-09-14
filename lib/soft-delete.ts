/** Filtre Supabase : enregistrements non supprimés */
export function applyNotDeleted<T extends { is: (col: string, val: null) => T }>(query: T): T {
  return query.is("deleted_at", null);
}

export type CorbeilleFiltre = "actifs" | "supprimes" | "tous";

export type CorbeilleElementType = "facture" | "produit" | "entreprise";

export interface CorbeilleElement {
  id: string;
  type: CorbeilleElementType;
  label: string;
  deleted_at: string | null;
  updated_at: string;
}
