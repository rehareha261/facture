"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { ClientFormData } from "@/lib/types";

export type ActionResult = {
  success: boolean;
  error?: string;
  factureCount?: number;
};

function toClientPayload(data: ClientFormData) {
  return {
    nom: data.nom.trim(),
    adresse: data.adresse.trim() || null,
    email: data.email.trim() || null,
    telephone: data.telephone.trim() || null,
    est_professionnel: data.est_professionnel,
    nif: data.est_professionnel ? data.nif.trim() || null : null,
    stat: data.est_professionnel ? data.stat.trim() || null : null,
  };
}

function validateClientForm(data: ClientFormData): string | null {
  if (!data.nom.trim()) return "Le nom du client est obligatoire.";
  if (data.est_professionnel && !data.nif.trim() && !data.stat.trim()) {
    return "Pour un client professionnel, renseignez au moins le NIF ou le STAT.";
  }
  return null;
}

export async function createClient(data: ClientFormData): Promise<ActionResult> {
  const validationError = validateClientForm(data);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("clients").insert(toClientPayload(data));

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/clients");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateClient(id: string, data: ClientFormData): Promise<ActionResult> {
  const validationError = validateClientForm(data);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("clients").update(toClientPayload(data)).eq("id", id);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/clients");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseClient();

  const { count, error: countError } = await supabase
    .from("factures")
    .select("*", { count: "exact", head: true })
    .eq("client_id", id);

  if (countError) return { success: false, error: getSupabaseErrorMessage(countError) };

  if (count && count > 0) {
    return {
      success: false,
      error: `Impossible de supprimer ce client : ${count} facture(s) lui sont associées.`,
      factureCount: count,
    };
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/clients");
  revalidatePath("/admin");
  return { success: true };
}
