-- ============================================================
-- Migration : entreprise simplifiée (Odette)
-- Supprime les colonnes inutilisées : contact, logo, RCS, n° TVA, IBAN
-- À exécuter une fois dans l'éditeur SQL Supabase
-- (après schema.sql et schema-auth.sql)
-- ============================================================

ALTER TABLE entreprise DROP COLUMN IF EXISTS telephone;
ALTER TABLE entreprise DROP COLUMN IF EXISTS email;
ALTER TABLE entreprise DROP COLUMN IF EXISTS logo_url;
ALTER TABLE entreprise DROP COLUMN IF EXISTS numero_rcs;
ALTER TABLE entreprise DROP COLUMN IF EXISTS numero_tva;
ALTER TABLE entreprise DROP COLUMN IF EXISTS iban;

-- Colonnes conservées : nom, adresse, nif, stat, activite, taux_tva (+ audit)
