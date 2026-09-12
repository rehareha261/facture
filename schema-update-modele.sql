-- Champs pour le modèle de facture malgache
ALTER TABLE entreprise
  ADD COLUMN IF NOT EXISTS activite TEXT,
  ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(5, 2) NOT NULL DEFAULT 20
    CHECK (taux_tva >= 0 AND taux_tva <= 100);

ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS mode_paiement TEXT DEFAULT 'AU COMPTANT';
