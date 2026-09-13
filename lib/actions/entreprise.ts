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

export async function getEntreprises(): Promise<{
  data: Entreprise[];
  error?: string;
}> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("entreprise")
    .select("*")
    .order("nom");

  if (error) return { data: [], error: getSupabaseErrorMessage(error) };
  return { data: (data ?? []) as Entreprise[] };
}

/** @deprecated Utiliser getEntreprises — première entreprise */
export async function getEntreprise(): Promise<{
  data: Entreprise | null;
  error?: string;
}> {
  const { data, error } = await getEntreprises();
  return { data: data[0] ?? null, error };
}

export async function getEntrepriseById(id: string): Promise<{
  data: Entreprise | null;
  error?: string;
}> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("entreprise").select("*").eq("id", id).maybeSingle();

  if (error) return { data: null, error: getSupabaseErrorMessage(error) };
  return { data: data as Entreprise | null };
}

export async function saveEntreprise(
  data: EntrepriseFormData,
  existingId?: string | null
): Promise<ActionResult & { id?: string }> {
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
    revalidatePaths();
    return { success: true, id: existingId };
  }

  const { data: inserted, error } = await supabase
    .from("entreprise")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePaths();
  return { success: true, id: inserted.id as string };
}

export async function deleteEntreprise(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseClient();

  const [facturesRes, produitsRes] = await Promise.all([
    supabase.from("factures").select("*", { count: "exact", head: true }).eq("entreprise_id", id),
    supabase.from("produits").select("*", { count: "exact", head: true }).eq("entreprise_id", id),
  ]);

  if (facturesRes.error) return { success: false, error: getSupabaseErrorMessage(facturesRes.error) };
  if (produitsRes.error) return { success: false, error: getSupabaseErrorMessage(produitsRes.error) };

  if ((facturesRes.count ?? 0) > 0) {
    return {
      success: false,
      error: "Impossible de supprimer : des factures sont liées à cette entreprise.",
    };
  }
  if ((produitsRes.count ?? 0) > 0) {
    return {
      success: false,
      error: "Impossible de supprimer : des produits sont liés à cette entreprise.",
    };
  }

  const { error } = await supabase.from("entreprise").delete().eq("id", id);
  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePaths();
  return { success: true };
}

function revalidatePaths() {
  revalidatePath("/entreprise");
  revalidatePath("/factures/nouvelle");
  revalidatePath("/");
  revalidatePath("/admin");
}
