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
    numero_rcs: data.numero_rcs.trim() || null,
    numero_tva: data.numero_tva.trim() || null,
    telephone: data.telephone.trim() || null,
    email: data.email.trim() || null,
    logo_url: data.logo_url.trim() || null,
    iban: data.iban.trim() || null,
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
