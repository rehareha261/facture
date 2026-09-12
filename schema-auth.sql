-- ============================================================
-- Migration AUTH + AUDIT
-- À exécuter APRÈS schema.sql sur une base existante
-- ============================================================

-- ------------------------------------------------------------
-- Profils utilisateurs (liés à auth.users)
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

-- Création auto du profil à l'inscription
-- Le premier utilisateur devient admin automatiquement
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
-- Colonnes d'audit sur les tables métier
-- ------------------------------------------------------------
ALTER TABLE entreprise
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE produits
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE lignes_facture
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- Triggers : updated_at + created_by / updated_by via auth.uid()
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tables avec created_by + updated_by (entreprise, clients, produits, factures)
CREATE OR REPLACE FUNCTION set_audit_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  NEW.updated_by = COALESCE(NEW.updated_by, auth.uid());
  RETURN NEW;
END;
$$;

-- lignes_facture : created_by seulement (pas de updated_by)
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

-- Entreprise
DROP TRIGGER IF EXISTS trg_entreprise_audit_insert ON entreprise;
CREATE TRIGGER trg_entreprise_audit_insert
  BEFORE INSERT ON entreprise FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert();
DROP TRIGGER IF EXISTS trg_entreprise_audit_update ON entreprise;
CREATE TRIGGER trg_entreprise_audit_update
  BEFORE UPDATE ON entreprise FOR EACH ROW EXECUTE FUNCTION set_audit_on_update();

-- Clients
DROP TRIGGER IF EXISTS trg_clients_audit_insert ON clients;
CREATE TRIGGER trg_clients_audit_insert
  BEFORE INSERT ON clients FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert();
DROP TRIGGER IF EXISTS trg_clients_audit_update ON clients;
CREATE TRIGGER trg_clients_audit_update
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_audit_on_update();

-- Produits
DROP TRIGGER IF EXISTS trg_produits_audit_insert ON produits;
CREATE TRIGGER trg_produits_audit_insert
  BEFORE INSERT ON produits FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert();
DROP TRIGGER IF EXISTS trg_produits_audit_update ON produits;
CREATE TRIGGER trg_produits_audit_update
  BEFORE UPDATE ON produits FOR EACH ROW EXECUTE FUNCTION set_audit_on_update();

-- Factures
DROP TRIGGER IF EXISTS trg_factures_audit_insert ON factures;
CREATE TRIGGER trg_factures_audit_insert
  BEFORE INSERT ON factures FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert();
DROP TRIGGER IF EXISTS trg_factures_audit_update ON factures;
CREATE TRIGGER trg_factures_audit_update
  BEFORE UPDATE ON factures FOR EACH ROW EXECUTE FUNCTION set_audit_on_update();

-- Lignes facture (création seulement — pas de updated_by)
DROP TRIGGER IF EXISTS trg_lignes_audit_insert ON lignes_facture;
CREATE TRIGGER trg_lignes_audit_insert
  BEFORE INSERT ON lignes_facture FOR EACH ROW EXECUTE FUNCTION set_audit_on_insert_ligne();

-- Helper : vérifier si l'utilisateur courant est admin
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

-- ------------------------------------------------------------
-- RLS : remplacer les politiques ouvertes
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Accès public entreprise"     ON entreprise;
DROP POLICY IF EXISTS "Accès public clients"        ON clients;
DROP POLICY IF EXISTS "Accès public produits"     ON produits;
DROP POLICY IF EXISTS "Accès public factures"     ON factures;
DROP POLICY IF EXISTS "Accès public lignes_facture" ON lignes_facture;

-- Profiles : chaque user voit son profil, admin voit tout
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Voir son profil" ON profiles;
CREATE POLICY "Voir son profil" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Admin gère les profils" ON profiles;
CREATE POLICY "Admin gère les profils" ON profiles
  FOR UPDATE USING (is_admin());

-- Tables métier : utilisateurs authentifiés
CREATE POLICY "Auth read entreprise"   ON entreprise   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write entreprise"  ON entreprise   FOR ALL    USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth read clients"      ON clients      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write clients"     ON clients      FOR ALL    USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth read produits"     ON produits     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write produits"    ON produits     FOR ALL    USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth read factures"     ON factures     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write factures"    ON factures     FOR ALL    USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth read lignes"       ON lignes_facture FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write lignes"      ON lignes_facture FOR ALL    USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Storage : authentifié pour écriture, public en lecture (PDF)
DROP POLICY IF EXISTS "Upload PDF factures" ON storage.objects;
DROP POLICY IF EXISTS "Mise à jour PDF factures" ON storage.objects;
DROP POLICY IF EXISTS "Suppression PDF factures" ON storage.objects;

CREATE POLICY "Auth upload PDF" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'factures' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update PDF" ON storage.objects
  FOR UPDATE USING (bucket_id = 'factures' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete PDF" ON storage.objects
  FOR DELETE USING (bucket_id = 'factures' AND auth.role() = 'authenticated');
