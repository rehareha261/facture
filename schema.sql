-- ============================================================
-- Schéma complet — Facturation Madagascar (Supabase)
-- Exécuter une seule fois dans l'éditeur SQL (base vide)
-- Données de démo optionnelles : schema-seed-ventes.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Profils (auth Supabase)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
  INTO is_first_user;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN is_first_user THEN 'admin' ELSE 'user' END
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- Entreprise (une seule ligne)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entreprise (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           TEXT NOT NULL,
  adresse       TEXT,
  nif           TEXT,
  stat          TEXT,
  activite      TEXT,
  taux_tva      NUMERIC(5, 2) NOT NULL DEFAULT 20 CHECK (taux_tva >= 0 AND taux_tva <= 100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Clients (legacy — factures sans client obligatoire)
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
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Catalogue produits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designation       TEXT NOT NULL,
  prix_unitaire_ht  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prix_unitaire_ht >= 0),
  taux_tva          NUMERIC(5, 2) NOT NULL DEFAULT 20 CHECK (taux_tva >= 0 AND taux_tva <= 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Factures
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          TEXT NOT NULL UNIQUE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  date_emission   DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance   DATE,
  statut          TEXT NOT NULL DEFAULT 'brouillon'
                  CHECK (statut IN ('brouillon', 'envoyee', 'payee', 'en_retard', 'annulee')),
  total_ht        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_tva       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_ttc       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes           TEXT,
  pdf_url         TEXT,
  mode_paiement   TEXT DEFAULT 'AU COMPTANT',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_factures_client_id ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_date_emission ON factures(date_emission DESC);
CREATE INDEX IF NOT EXISTS idx_factures_numero ON factures(numero);

-- ------------------------------------------------------------
-- Lignes de facture (prix figés à la création)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lignes_facture (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id        UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  produit_id        UUID REFERENCES produits(id) ON DELETE SET NULL,
  designation       TEXT NOT NULL,
  quantite          NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_unitaire_ht  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prix_unitaire_ht >= 0),
  taux_tva          NUMERIC(5, 2) NOT NULL DEFAULT 20 CHECK (taux_tva >= 0 AND taux_tva <= 100),
  ordre             INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lignes_facture_facture_id ON lignes_facture(facture_id);
CREATE INDEX IF NOT EXISTS idx_lignes_facture_produit_id ON lignes_facture(produit_id);

-- ------------------------------------------------------------
-- Numéro de facture : FAC-2026-001
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
-- Audit triggers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_audit_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  NEW.updated_by = COALESCE(NEW.updated_by, auth.uid());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_audit_on_insert_ligne()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_audit_on_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_entreprise_audit_insert ON entreprise;
CREATE TRIGGER trg_entreprise_audit_insert
  BEFORE INSERT ON entreprise FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert();
DROP TRIGGER IF EXISTS trg_entreprise_audit_update ON entreprise;
CREATE TRIGGER trg_entreprise_audit_update
  BEFORE UPDATE ON entreprise FOR EACH ROW EXECUTE FUNCTION set_audit_on_update();

DROP TRIGGER IF EXISTS trg_clients_audit_insert ON clients;
CREATE TRIGGER trg_clients_audit_insert
  BEFORE INSERT ON clients FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert();
DROP TRIGGER IF EXISTS trg_clients_audit_update ON clients;
CREATE TRIGGER trg_clients_audit_update
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_audit_on_update();

DROP TRIGGER IF EXISTS trg_produits_audit_insert ON produits;
CREATE TRIGGER trg_produits_audit_insert
  BEFORE INSERT ON produits FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert();
DROP TRIGGER IF EXISTS trg_produits_audit_update ON produits;
CREATE TRIGGER trg_produits_audit_update
  BEFORE UPDATE ON produits FOR EACH ROW EXECUTE FUNCTION set_audit_on_update();

DROP TRIGGER IF EXISTS trg_factures_audit_insert ON factures;
CREATE TRIGGER trg_factures_audit_insert
  BEFORE INSERT ON factures FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert();
DROP TRIGGER IF EXISTS trg_factures_audit_update ON factures;
CREATE TRIGGER trg_factures_audit_update
  BEFORE UPDATE ON factures FOR EACH ROW EXECUTE FUNCTION set_audit_on_update();

DROP TRIGGER IF EXISTS trg_lignes_audit_insert ON lignes_facture;
CREATE TRIGGER trg_lignes_audit_insert
  BEFORE INSERT ON lignes_facture FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert_ligne();

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- PDF : générés à la demande (pas de bucket Storage — quota Supabase)

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprise       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_facture   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Voir son profil" ON profiles;
CREATE POLICY "Voir son profil" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Admin gère les profils" ON profiles;
CREATE POLICY "Admin gère les profils" ON profiles
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Auth read entreprise" ON entreprise;
DROP POLICY IF EXISTS "Auth write entreprise" ON entreprise;
CREATE POLICY "Auth read entreprise"  ON entreprise FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write entreprise" ON entreprise FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth read clients" ON clients;
DROP POLICY IF EXISTS "Auth write clients" ON clients;
CREATE POLICY "Auth read clients"  ON clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write clients" ON clients FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth read produits" ON produits;
DROP POLICY IF EXISTS "Auth write produits" ON produits;
CREATE POLICY "Auth read produits"  ON produits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write produits" ON produits FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth read factures" ON factures;
DROP POLICY IF EXISTS "Auth write factures" ON factures;
CREATE POLICY "Auth read factures"  ON factures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write factures" ON factures FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth read lignes" ON lignes_facture;
DROP POLICY IF EXISTS "Auth write lignes" ON lignes_facture;
CREATE POLICY "Auth read lignes"  ON lignes_facture FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write lignes" ON lignes_facture FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
