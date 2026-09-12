-- ============================================================
-- CORRECTION : erreur "record new has no field updated_by"
-- sur lignes_facture à la création d'une facture
-- ============================================================
-- Cause : set_audit_on_insert() écrit updated_by, colonne absente
--         sur lignes_facture (audit création seulement).

-- Fonction dédiée aux lignes de facture (created_by uniquement)
CREATE OR REPLACE FUNCTION set_audit_on_insert_ligne()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END;
$$;

-- Remplacer le trigger incorrect sur lignes_facture
DROP TRIGGER IF EXISTS trg_lignes_audit_insert ON lignes_facture;
CREATE TRIGGER trg_lignes_audit_insert
  BEFORE INSERT ON lignes_facture
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_on_insert_ligne();
