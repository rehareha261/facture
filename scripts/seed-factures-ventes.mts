/**
 * Insère les factures seed (2023–2025) — préfixe SEED-VENTES-
 * Prérequis : produits importés via /produits (CSV Libelle, PU)
 *
 * Usage :
 *   npx tsx scripts/seed-factures-ventes.mts --dry-run
 *   npx tsx scripts/seed-factures-ventes.mts --clean
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  genererToutesLesFacturesSeed,
  verifierTotauxMensuelsSeed,
  type ProduitRef,
} from "../lib/generer-lignes-ventes.ts";
import { arrondirMontant, calculerLigne } from "../lib/facture-calculs.ts";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error("Fichier .env.local introuvable.");
    process.exit(1);
  }
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim();
  }
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const clean = args.has("--clean");

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getTauxTva(): Promise<number> {
  const { data } = await supabase.from("entreprise").select("taux_tva").limit(1).maybeSingle();
  return data?.taux_tva ?? 20;
}

async function main() {
  const { data: produitsDb, error: prodErr } = await supabase
    .from("produits")
    .select("id, designation, prix_unitaire_ht")
    .order("prix_unitaire_ht");

  if (prodErr) {
    console.error("Erreur chargement produits :", prodErr.message);
    process.exit(1);
  }

  if (!produitsDb?.length) {
    console.error("Aucun produit en base. Importez d'abord le CSV via /produits.");
    process.exit(1);
  }

  const produits: ProduitRef[] = produitsDb.map((p) => ({
    id: p.id,
    designation: p.designation,
    prix_unitaire_ht: Number(p.prix_unitaire_ht),
  }));

  console.log(`${produits.length} produit(s) trouvé(s).`);

  const { data: entreprises, error: entErr } = await supabase
    .from("entreprise")
    .select("id, nom")
    .order("created_at")
    .limit(1);

  if (entErr || !entreprises?.length) {
    console.error("Créez au moins une entreprise dans Mes entreprises avant le seed.");
    process.exit(1);
  }

  const entrepriseId = entreprises[0]!.id;
  console.log(`Entreprise seed : ${entreprises[0]!.nom}`);

  const factures = genererToutesLesFacturesSeed(produits);
  const verifs = verifierTotauxMensuelsSeed(factures);
  const echecs = verifs.filter((v) => !v.ok);

  console.log(`${factures.length} factures générées.`);
  if (echecs.length > 0) {
    console.error("Écarts mensuels :");
    for (const e of echecs) {
      console.error(
        `  ${e.annee}-${String(e.mois).padStart(2, "0")} cible=${e.cible} obtenu=${e.obtenu}`
      );
    }
    process.exit(1);
  }
  console.log("Vérification locale OK.\n");

  if (dryRun) {
    for (const v of verifs) {
      console.log(
        `  ${v.annee}-${String(v.mois).padStart(2, "0")} : ${v.obtenu} HT (${factures.filter((f) => f.annee === v.annee && f.mois === v.mois).length} fact.)`
      );
    }
    return;
  }

  if (clean) {
    console.log("Suppression des factures SEED-VENTES-* …");
    const { error: delErr } = await supabase
      .from("factures")
      .delete()
      .like("numero", "SEED-VENTES-%");
    if (delErr) {
      console.error("Erreur suppression :", delErr.message);
      process.exit(1);
    }
  }

  const tauxTva = await getTauxTva();
  let inserees = 0;

  for (const facture of factures) {
    const totaux = facture.lignes.reduce(
      (acc, l) => {
        const t = calculerLigne(l.quantite, l.prix_unitaire_ht, tauxTva);
        return {
          total_ht: acc.total_ht + t.ht,
          total_tva: acc.total_tva + t.tva,
          total_ttc: acc.total_ttc + t.ttc,
        };
      },
      { total_ht: 0, total_tva: 0, total_ttc: 0 }
    );

    const { data: inserted, error: fErr } = await supabase
      .from("factures")
      .insert({
        numero: facture.numero,
        entreprise_id: entrepriseId,
        date_emission: facture.date_emission,
        total_ht: arrondirMontant(totaux.total_ht),
        total_tva: arrondirMontant(totaux.total_tva),
        total_ttc: arrondirMontant(totaux.total_ttc),
        mode_paiement: "AU COMPTANT",
      })
      .select("id")
      .single();

    if (fErr) {
      console.error(`Erreur ${facture.numero} :`, fErr.message);
      process.exit(1);
    }

    const lignesPayload = facture.lignes.map((l, ordre) => ({
      facture_id: inserted.id,
      produit_id: l.produit_id,
      designation: l.designation,
      quantite: l.quantite,
      prix_unitaire_ht: l.prix_unitaire_ht,
      taux_tva: tauxTva,
      ordre,
    }));

    const { error: lErr } = await supabase.from("lignes_facture").insert(lignesPayload);
    if (lErr) {
      console.error(`Erreur lignes ${facture.numero} :`, lErr.message);
      await supabase.from("factures").delete().eq("id", inserted.id);
      process.exit(1);
    }

    inserees++;
    if (inserees % 50 === 0) process.stdout.write(`  ${inserees}/${factures.length}\r`);
  }

  console.log(`\nTerminé : ${inserees} factures SEED insérées.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
