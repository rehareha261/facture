-- ============================================================
-- Migration : factures sans client obligatoire
-- À exécuter une fois dans l'éditeur SQL Supabase
-- (après schema.sql et schema-auth.sql)
-- ============================================================

-- 1. client_id devient optionnel
ALTER TABLE factures
  ALTER COLUMN client_id DROP NOT NULL;

-- 2. Si un client est supprimé, la facture reste (client_id → NULL)
ALTER TABLE factures
  DROP CONSTRAINT IF EXISTS factures_client_id_fkey;

ALTER TABLE factures
  ADD CONSTRAINT factures_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
