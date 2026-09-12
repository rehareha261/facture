```sql
-- ============================================================
-- Schéma facturation — Madagascar
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Table entreprise (une seule ligne)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entreprise (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           TEXT NOT NULL,
  adresse       TEXT,
  nif           TEXT,
  stat          TEXT,
  numero_rcs    TEXT,
  numero_tva    TEXT,
  telephone     TEXT,
  email         TEXT,
  logo_url      TEXT,
  iban          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Clients
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom                 TEXT NOT NULL,
  adresse             TEXT,
  email               TEXT,
  telephone           TEXT,
  est_professionnel   BOOLEAN NOT NULL DEFAULT false,
  nif                 TEXT,
  stat                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Catalogue produits (modèles pré-remplis)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designation       TEXT NOT NULL,
  prix_unitaire_ht  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prix_unitaire_ht >= 0),
  taux_tva          NUMERIC(5, 2) NOT NULL DEFAULT 20 CHECK (taux_tva >= 0 AND taux_tva <= 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Factures
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          TEXT NOT NULL UNIQUE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  date_emission   DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance   DATE,
  statut          TEXT NOT NULL DEFAULT 'brouillon'
                  CHECK (statut IN ('brouillon', 'envoyee', 'payee', 'en_retard', 'annulee')),
  total_ht        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_tva       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_ttc       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes           TEXT,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factures_client_id ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_date_emission ON factures(date_emission DESC);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);

-- ------------------------------------------------------------
-- Lignes de facture (valeurs figées à la création)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lignes_facture (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id        UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  produit_id        UUID REFERENCES produits(id) ON DELETE SET NULL,
  designation       TEXT NOT NULL,
  quantite          NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_unitaire_ht  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prix_unitaire_ht >= 0),
  taux_tva          NUMERIC(5, 2) NOT NULL DEFAULT 20 CHECK (taux_tva >= 0 AND taux_tva <= 100),
  ordre             INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lignes_facture_facture_id ON lignes_facture(facture_id);

-- ------------------------------------------------------------
-- Génération automatique du numéro de facture : FAC-2026-001
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION generer_numero_facture()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  annee        TEXT := to_char(CURRENT_DATE, 'YYYY');
  prefixe      TEXT := 'FAC-' || annee || '-';
  dernier_num  INTEGER;
  nouveau_num  TEXT;
BEGIN
  SELECT COALESCE(
    MAX(
      CAST(
        NULLIF(regexp_replace(numero, '^FAC-[0-9]{4}-', ''), '')
        AS INTEGER
      )
    ),
    0
  )
  INTO dernier_num
  FROM factures
  WHERE numero LIKE prefixe || '%';

  nouveau_num := prefixe || lpad((dernier_num + 1)::TEXT, 3, '0');
  RETURN nouveau_num;
END;
$$;

-- ------------------------------------------------------------
-- Donnée entreprise par défaut (à adapter)
-- ------------------------------------------------------------
INSERT INTO entreprise (nom, adresse, nif, stat, telephone, email)
SELECT
  'Mon Entreprise',
  'Antananarivo, Madagascar',
  '0000000000',
  '000000000',
  '+261 00 00 000 00',
  'contact@entreprise.mg'
WHERE NOT EXISTS (SELECT 1 FROM entreprise);

-- ------------------------------------------------------------
-- Storage : bucket pour les PDF
-- (à exécuter si le bucket n'existe pas encore)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('factures', 'factures', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques Storage (accès public en lecture, écriture via clé API)
CREATE POLICY "PDF public en lecture"
ON storage.objects FOR SELECT
USING (bucket_id = 'factures');

CREATE POLICY "Upload PDF factures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'factures');

CREATE POLICY "Mise à jour PDF factures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'factures');

CREATE POLICY "Suppression PDF factures"
ON storage.objects FOR DELETE
USING (bucket_id = 'factures');

-- ------------------------------------------------------------
-- RLS : accès ouvert (pas d'auth en V1)
-- ⚠️ À restreindre quand l'authentification sera ajoutée
-- ------------------------------------------------------------
ALTER TABLE entreprise       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_facture   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accès public entreprise"       ON entreprise     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accès public clients"          ON clients         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accès public produits"         ON produits        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accès public factures"         ON factures        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Accès public lignes_facture"   ON lignes_facture  FOR ALL USING (true) WITH CHECK (true);
```