/** Types alignés sur le schéma Supabase */

export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/** Champs d'audit standard (visible admin uniquement dans l'UI) */
export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface AuditDisplay {
  created_at: string;
  updated_at: string;
  created_by_name: string | null;
  updated_by_name: string | null;
}

export type StatutFacture =
  | "brouillon"
  | "envoyee"
  | "payee"
  | "en_retard"
  | "annulee";

export interface Entreprise extends AuditFields {
  id: string;
  nom: string;
  adresse: string | null;
  nif: string | null;
  stat: string | null;
  numero_rcs: string | null;
  numero_tva: string | null;
  telephone: string | null;
  email: string | null;
  logo_url: string | null;
  iban: string | null;
}

export interface Client extends AuditFields {
  id: string;
  nom: string;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  est_professionnel: boolean;
  nif: string | null;
  stat: string | null;
}

export interface Produit extends AuditFields {
  id: string;
  designation: string;
  prix_unitaire_ht: number;
  taux_tva: number;
}

export interface Facture extends AuditFields {
  id: string;
  numero: string;
  client_id: string;
  date_emission: string;
  date_echeance: string | null;
  statut: StatutFacture;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  notes: string | null;
  pdf_url: string | null;
}

export interface LigneFacture {
  id: string;
  facture_id: string;
  produit_id: string | null;
  designation: string;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
  ordre: number;
}

/** Données du formulaire entreprise */
export interface EntrepriseFormData {
  nom: string;
  adresse: string;
  nif: string;
  stat: string;
  numero_rcs: string;
  numero_tva: string;
  telephone: string;
  email: string;
  logo_url: string;
  iban: string;
}

/** Données du formulaire client (création / modification) */
export interface ClientFormData {
  nom: string;
  adresse: string;
  email: string;
  telephone: string;
  est_professionnel: boolean;
  nif: string;
  stat: string;
}

/** Données du formulaire produit */
export interface ProduitFormData {
  designation: string;
  prix_unitaire_ht: number;
  taux_tva: number;
}

/** Ligne de facture en cours de saisie (avant enregistrement) */
export interface LigneFactureDraft {
  /** Identifiant temporaire côté client pour React keys */
  tempId: string;
  produit_id: string | null;
  designation: string;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
}

/** Facture avec client joint (pour affichage liste) */
export interface FactureAvecClient extends Facture {
  clients: Pick<Client, "nom"> | null;
}

/** Facture complète avec lignes et client (pour détail / PDF) */
export interface FactureComplete extends Facture {
  clients: Client | null;
  lignes_facture: LigneFacture[];
}
