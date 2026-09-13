/** Devise unique utilisée dans toute l'application (Madagascar) */
export const DEVISE = "MGA" as const;
export const DEVISE_SYMBOLE = "Ar" as const;

export const TAUX_TVA_DEFAUT = 20;

/** Libellés des statuts de facture */
export const STATUTS_FACTURE = [
  "brouillon",
  "envoyee",
  "payee",
  "en_retard",
  "annulee",
] as const;
