"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase-utils";
import type { ActionResult } from "@/lib/actions/clients";
import type { Profile, UserRole } from "@/lib/types";

/** Liste tous les utilisateurs (admin uniquement) */
export async function getAllProfiles(): Promise<{ data: Profile[]; error?: string }> {
  await requireAdmin();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: getSupabaseErrorMessage(error) };
  return { data: (data ?? []) as Profile[] };
}

/** Change le rôle d'un utilisateur (admin uniquement) */
export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const admin = await requireAdmin();

  if (userId === admin.id && role !== "admin") {
    return { success: false, error: "Vous ne pouvez pas retirer votre propre rôle admin." };
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);

  if (error) return { success: false, error: getSupabaseErrorMessage(error) };

  revalidatePath("/admin");
  return { success: true };
}
