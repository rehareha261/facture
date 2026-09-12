"use server";

import { revalidatePath } from "next/cache";
import { arrondirMontant, calculerTotauxFacture } from "@/lib/facture-calculs";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { ActionResult } from "@/lib/actions/clients";
import type { LigneFactureDraft, StatutFacture } from "@/lib/types";

export interface CreateFactureInput {
  client_id: string;
  numero: string;
  date_emission: string;
  date_echeance: string | null;
  notes: string | null;
  lignes: LigneFactureDraft[];
}

export async function genererNumeroFacture(): Promise<{ numero: string | null; error?: string }> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.rpc("generer_numero_facture");

  if (error) return { numero: null, error: getSupabaseErrorMessage(error) };
  return { numero: data as string };
}

function validateFactureInput(input: CreateFactureInput): string | null {
  if (!input.client_id) return "Sélectionnez un client.";
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
  const totaux = calculerTotauxFacture(input.lignes);

  const { data: facture, error: factureError } = await supabase
    .from("factures")
    .insert({
      client_id: input.client_id,
      numero: input.numero.trim(),
      date_emission: input.date_emission,
      date_echeance: input.date_echeance || null,
      statut: "brouillon" as StatutFacture,
      total_ht: arrondirMontant(totaux.total_ht),
      total_tva: arrondirMontant(totaux.total_tva),
      total_ttc: arrondirMontant(totaux.total_ttc),
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (factureError || !facture) {
    return { success: false, error: getSupabaseErrorMessage(factureError) };
  }

  const lignesPayload = input.lignes.map((ligne, index) => ({
    facture_id: facture.id,
    produit_id: ligne.produit_id,
    designation: ligne.designation.trim(),
    quantite: ligne.quantite,
    prix_unitaire_ht: ligne.prix_unitaire_ht,
    taux_tva: ligne.taux_tva,
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

export async function updateFactureStatut(
  id: string,
  statut: StatutFacture
): Promise<ActionResult> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("factures").update({ statut }).eq("id", id);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/factures");
  revalidatePath(`/factures/${id}`);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateFacturePdfUrl(id: string, pdfUrl: string): Promise<ActionResult> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("factures").update({ pdf_url: pdfUrl }).eq("id", id);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/factures");
  revalidatePath(`/factures/${id}`);
  return { success: true };
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
