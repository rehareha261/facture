/**
 * Vérifie les totaux HT mensuels des factures SEED-VENTES en base.
 * Usage : npx tsx scripts/verify-lignes-ventes.mts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { arrondirMontant } from "../lib/facture-calculs.ts";
import { VENTES_MENSUELLES_HT } from "../lib/seed-ventes-mensuelles.ts";

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

async function main() {
  const { data, error } = await supabase
    .from("factures")
    .select("date_emission, total_ht")
    .like("numero", "SEED-VENTES-%");

  if (error) {
    console.error("Erreur :", error.message);
    process.exit(1);
  }

  const factures = data ?? [];
  console.log(`${factures.length} facture(s) SEED en base.\n`);

  let echecs = 0;

  for (const [anneeStr, montants] of Object.entries(VENTES_MENSUELLES_HT)) {
    const annee = Number(anneeStr);
    for (let mois = 1; mois <= 12; mois++) {
      const cible = montants[mois - 1]!;
      const duMois = factures.filter((f) => {
        const d = new Date(f.date_emission);
        return d.getFullYear() === annee && d.getMonth() + 1 === mois;
      });
      const obtenu = arrondirMontant(duMois.reduce((s, f) => s + Number(f.total_ht), 0));
      const ok = Math.abs(obtenu - cible) < 0.02;
      console.log(
        `${ok ? "OK" : "KO"}  ${annee}-${String(mois).padStart(2, "0")}  cible=${cible.toLocaleString("fr-FR")}  obtenu=${obtenu.toLocaleString("fr-FR")}  (${duMois.length} fact.)`
      );
      if (!ok) echecs++;
    }
  }

  if (echecs > 0) {
    console.error(`\n${echecs} mois en écart.`);
    process.exit(1);
  }
  console.log("\nTous les mois correspondent.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
