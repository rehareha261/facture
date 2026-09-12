/** Devise unique utilisée dans toute l'application (Madagascar) */
export const DEVISE = "MGA" as const;
export const DEVISE_SYMBOLE = "Ar" as const;

/** Libellés des statuts de facture */
export const STATUTS_FACTURE = [
  "brouillon",
  "envoyee",
  "payee",
  "en_retard",
  "annulee",
] as const;
