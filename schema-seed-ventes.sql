-- ============================================================
-- Données de démo : ventes mensuelles HT (2023–2025)
-- 1 facture par mois, totaux = tableau Excel Odette
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

DELETE FROM factures WHERE numero LIKE 'SEED-VENTES-%';

WITH data(annee, mois, total_ht) AS (
  VALUES
    -- 2023
    (2023, 1, 23315200.00), (2023, 2, 637797.10), (2023, 3, 23127240.00),
    (2023, 4, 13434525.67), (2023, 5, 9262154.17), (2023, 6, 5649800.00),
    (2023, 7, 3764002.00), (2023, 8, 2343659.00), (2023, 9, 2126033.00),
    (2023, 10, 17015100.00), (2023, 11, 25485450.00), (2023, 12, 48995885.00),
    -- 2024
    (2024, 1, 3110800.00), (2024, 2, 38850894.60), (2024, 3, 38850894.60),
    (2024, 4, 45855900.00), (2024, 5, 62358900.00), (2024, 6, 36852600.00),
    (2024, 7, 46752800.00), (2024, 8, 36098365.00), (2024, 9, 48325000.00),
    (2024, 10, 40362670.00), (2024, 11, 45235201.00), (2024, 12, 36845120.00),
    -- 2025
    (2025, 1, 18489061.00), (2025, 2, 30162615.00), (2025, 3, 32599800.00),
    (2025, 4, 44955010.00), (2025, 5, 55862600.00), (2025, 6, 12773264.00),
    (2025, 7, 33299350.00), (2025, 8, 49336550.00), (2025, 9, 15450187.00),
    (2025, 10, 21473233.00), (2025, 11, 49856200.00), (2025, 12, 23651975.00)
),
inserted AS (
  INSERT INTO factures (
    numero,
    date_emission,
    total_ht,
    total_tva,
    total_ttc,
    mode_paiement
  )
  SELECT
    'SEED-VENTES-' || annee || '-' || LPAD(mois::text, 2, '0'),
    make_date(annee, mois, 15),
    total_ht,
    ROUND(total_ht * 0.20, 2),
    ROUND(total_ht * 1.20, 2),
    'AU COMPTANT'
  FROM data
  RETURNING id, total_ht
)
INSERT INTO lignes_facture (
  facture_id,
  designation,
  quantite,
  prix_unitaire_ht,
  taux_tva,
  ordre
)
SELECT
  id,
  'Vente mensuelle boissons alcooliques (HT)',
  1,
  total_ht,
  20,
  0
FROM inserted;
