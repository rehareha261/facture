"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import { getTauxTvaGlobal } from "@/lib/taux-tva";
import type { ActionResult } from "@/lib/actions/clients";
import type { ProduitFormData } from "@/lib/types";

function validateProduitForm(data: ProduitFormData): string | null {
  if (!data.designation.trim()) return "La désignation est obligatoire.";
  if (data.prix_unitaire_ht < 0) return "Le prix unitaire HT ne peut pas être négatif.";
  return null;
}

export async function createProduit(data: ProduitFormData): Promise<ActionResult> {
  const validationError = validateProduitForm(data);
  if (validationError) return { success: false, error: validationError };

  const taux_tva = await getTauxTvaGlobal();
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("produits").insert({
    designation: data.designation.trim(),
    prix_unitaire_ht: data.prix_unitaire_ht,
    taux_tva,
  });

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/produits");
  revalidatePath("/factures/nouvelle");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateProduit(id: string, data: ProduitFormData): Promise<ActionResult> {
  const validationError = validateProduitForm(data);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("produits")
    .update({
      designation: data.designation.trim(),
      prix_unitaire_ht: data.prix_unitaire_ht,
    })
    .eq("id", id);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/produits");
  revalidatePath("/factures/nouvelle");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteProduit(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("produits").delete().eq("id", id);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/produits");
  revalidatePath("/factures/nouvelle");
  revalidatePath("/admin");
  return { success: true };
}
