"use server";

import { revalidatePath } from "next/cache";
import { arrondirMontant, calculerTotauxFacture } from "@/lib/facture-calculs";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import { getTauxTvaEntreprise } from "@/lib/taux-tva";
import type { ActionResult } from "@/lib/actions/clients";
import type { LigneFactureDraft } from "@/lib/types";

export interface CreateFactureInput {
  entreprise_id: string;
  numero: string;
  date_emission: string;
  date_echeance: string | null;
  notes: string | null;
  mode_paiement: string | null;
  lignes: LigneFactureDraft[];
}

export async function genererNumeroFacture(): Promise<{ numero: string | null; error?: string }> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.rpc("generer_numero_facture");

  if (error) return { numero: null, error: getSupabaseErrorMessage(error) };
  return { numero: data as string };
}

function validateFactureInput(input: CreateFactureInput): string | null {
  if (!input.entreprise_id) return "L'entreprise est obligatoire.";
  if (!input.numero.trim()) return "Le numéro de facture est obligatoire.";
  if (!input.date_emission) return "La date d'émission est obligatoire.";
  if (input.lignes.length === 0) return "Ajoutez au moins une ligne de facturation.";

  for (const ligne of input.lignes) {
    if (!ligne.designation.trim()) return "Chaque ligne doit avoir une désignation.";
    if (ligne.quantite <= 0) return "La quantité doit être supérieure à 0.";
    if (ligne.prix_unitaire_ht < 0) return "Le prix unitaire ne peut pas être négatif.";
  }
  return null;
}

export async function createFacture(
  input: CreateFactureInput
): Promise<ActionResult & { factureId?: string }> {
  const validationError = validateFactureInput(input);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createSupabaseClient();
  const tauxTva = await getTauxTvaEntreprise(input.entreprise_id);
  const lignesAvecTva = input.lignes.map((l) => ({ ...l, taux_tva: tauxTva }));
  const totaux = calculerTotauxFacture(lignesAvecTva);

  const { data: facture, error: factureError } = await supabase
    .from("factures")
    .insert({
      numero: input.numero.trim(),
      entreprise_id: input.entreprise_id,
      date_emission: input.date_emission,
      date_echeance: input.date_echeance || null,
      total_ht: arrondirMontant(totaux.total_ht),
      total_tva: arrondirMontant(totaux.total_tva),
      total_ttc: arrondirMontant(totaux.total_ttc),
      notes: input.notes?.trim() || null,
      mode_paiement: input.mode_paiement?.trim() || "AU COMPTANT",
    })
    .select("id")
    .single();

  if (factureError || !facture) {
    return { success: false, error: getSupabaseErrorMessage(factureError) };
  }

  const lignesPayload = lignesAvecTva.map((ligne, index) => ({
    facture_id: facture.id,
    produit_id: ligne.produit_id,
    designation: ligne.designation.trim(),
    quantite: ligne.quantite,
    prix_unitaire_ht: ligne.prix_unitaire_ht,
    taux_tva: tauxTva,
    ordre: index,
  }));

  const { error: lignesError } = await supabase.from("lignes_facture").insert(lignesPayload);

  if (lignesError) {
    await supabase.from("factures").delete().eq("id", facture.id);
    return { success: false, error: getSupabaseErrorMessage(lignesError) };
  }

  revalidatePath("/factures");
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, factureId: facture.id };
}

export interface FactureBatchInput {
  entreprise_id: string;
  date_emission: string;
  mode_paiement?: string | null;
  lignes: {
    produit_id: string | null;
    designation: string;
    quantite: number;
    prix_unitaire_ht: number;
  }[];
}

export async function createFacturesBatch(
  factures: FactureBatchInput[]
): Promise<ActionResult & { count?: number }> {
  if (factures.length === 0) {
    return { success: false, error: "Aucune facture à enregistrer." };
  }

  let count = 0;

  for (const facture of factures) {
    const { numero, error: numErr } = await genererNumeroFacture();
    if (numErr || !numero) {
      return {
        success: false,
        error: numErr ?? `Impossible de générer le numéro (facture ${count + 1}).`,
      };
    }

    const result = await createFacture({
      entreprise_id: facture.entreprise_id,
      numero,
      date_emission: facture.date_emission,
      date_echeance: null,
      notes: null,
      mode_paiement: facture.mode_paiement ?? "AU COMPTANT",
      lignes: facture.lignes.map((l) => ({
        tempId: crypto.randomUUID(),
        produit_id: l.produit_id,
        designation: l.designation,
        quantite: l.quantite,
        prix_unitaire_ht: l.prix_unitaire_ht,
        taux_tva: 0,
      })),
    });

    if (!result.success) {
      return {
        success: false,
        error: `${count} facture(s) enregistrée(s). Erreur sur la suivante : ${result.error}`,
      };
    }
    count++;
  }

  return { success: true, count };
}

export async function deleteFacture(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("factures").delete().eq("id", id);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/factures");
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
