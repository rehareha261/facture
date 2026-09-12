"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { ActionResult } from "@/lib/actions/clients";
import type { Entreprise, EntrepriseFormData } from "@/lib/types";

function toPayload(data: EntrepriseFormData) {
  return {
    nom: data.nom.trim(),
    adresse: data.adresse.trim() || null,
    nif: data.nif.trim() || null,
    stat: data.stat.trim() || null,
    activite: data.activite.trim() || null,
    taux_tva: data.taux_tva,
  };
}

export async function getEntreprise(): Promise<{
  data: Entreprise | null;
  error?: string;
}> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("entreprise").select("*").limit(1).maybeSingle();

  if (error) return { data: null, error: getSupabaseErrorMessage(error) };
  return { data: data as Entreprise | null };
}

export async function saveEntreprise(
  data: EntrepriseFormData,
  existingId?: string | null
): Promise<ActionResult> {
  if (!data.nom.trim()) {
    return { success: false, error: "Le nom de l'entreprise est obligatoire." };
  }
  if (data.taux_tva < 0 || data.taux_tva > 100) {
    return { success: false, error: "Le taux de TVA doit être entre 0 et 100." };
  }

  const supabase = await createSupabaseClient();
  const payload = toPayload(data);

  if (existingId) {
    const { error } = await supabase.from("entreprise").update(payload).eq("id", existingId);
    if (error) return { success: false, error: getSupabaseErrorMessage(error) };
  } else {
    const { error } = await supabase.from("entreprise").insert(payload);
    if (error) return { success: false, error: getSupabaseErrorMessage(error) };
  }

  revalidatePath("/entreprise");
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
